'use strict';

var mongoose = require('mongoose'),
  	cors 			= require('cors'),
  	userDB			= mongoose.model('myUserDatabase'),
  	blog			= mongoose.model('blog'),
  	express 		= require('express'),
  	app 			= express(),
	BlogDB=mongoose.model('myBlogDatabase'),
  	cookieParser	= require('cookie-parser'),
  	session 		= require('express-session'),
  	bodyParser 		= require('body-parser'),
  	MongoStore  	= require('connect-mongo')(session),
  	path 			= require('path');

  	var multer  	= require('multer');
	var sess;

exports.first_page  = function(req, res) 
{
	if(req.session.username)
		{
			res.redirect('/dashboard');
		}
		else
		{
			res.render('index.html');
		}
	};
 
exports.sendSignupCredents= function(req, res) 
{
	var salt;
	var passwordData;
	
	//hashing and salting the password:-  
	var crypto = require('crypto');
	const username = req.body.username;
	const password = req.body.password;
	const dob = req.body.dob;
	const firstName = req.body.firstName;
	const lastName = req.body.lastName;
	const country = req.body.country;
	const state = req.body.state;

	var genRandomString = function(length){
		return crypto.randomBytes(Math.ceil(length/2))
				.toString('hex') /** convert to hexadecimal format */
				.slice(0,length);   /** return required number of characters */
	};

	var sha512 = function(password, salt){
		var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
		hash.update(password);
		var value = hash.digest('hex');
		return {
			salt:salt,
			passwordHash:value
		};
	};

	function saltHashPassword(userpassword) {
		salt = genRandomString(16); /** Gives us salt of length 16 */
		passwordData = sha512(userpassword, salt);
	}

	saltHashPassword(password);

  var UserData = new userDB({FirstName:firstName,LastName:lastName,Email:username,"PasswordHash":passwordData.passwordHash,"PasswordSalt":passwordData.salt,Country:country,State:state,DOB:dob});

  UserData.save(function(err, task) {
    if (err || task.length === 0)
		{
		res.send(err);
		}
	else
		{
		var query = { Email: username};
					console.log('sign up query >>>>>>>>>>>>>>>'+query);
					 userDB.find(query,function(err, result) {
					    if (err) throw err;
					  	
					   	if(!result[0]){
				   			res.render('index.html'); 
						}
						else{
				 			res.render('home.html',{
				   				userdetail : result[0]
				   		});	

				 		req.session.FirstName = result[0].FirstName;
  						req.session.LastName = result[0].LastName;
  						req.session.uid = result[0]._id;
					} 
			});
		}
		});
};
  
exports.sendLoginCredents = function(req, res) 
{
	const username = req.body.username;
	const password = req.body.password;
	userDB.find({Email:username}, function(err, task) 
	{
		
		if (err || task.length === 0)
		{
			res.send(err);
		}
		else
		{
		
			var salt;
			var passwordData;  
			var crypto = require('crypto');
			 
			var sha512 = function(password, salt){
				var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
				hash.update(password);
				var value = hash.digest('hex');
				return {
					salt:salt,
					passwordHash:value
				};
			};



			function saltHashPassword(userpassword) {
				salt = task[0].PasswordSalt;//genRandomString(16); /** Gives us salt of length 16 */
				passwordData = sha512(userpassword, salt);
			}

			saltHashPassword(password);
			
			if(task[0].PasswordHash ===passwordData.passwordHash)
				{
					req.session.username=username;
					var query = { Email: username };
					console.log('login query >>>>>>>>>>>>>>>>>>>>>>'+query);
					 userDB.find(query,function(err, result) {
					    if (err) throw err;
					   if(!result[0]){
							   res.render('index.html'); 
							}
						else{
							 res.render('home.html',{
							   			userdetail : result[0],
							   			
							   });	
							 
							   			

						}  
						req.session.FirstName = result[0].FirstName;
  						req.session.LastName = result[0].LastName;
  						req.session.uid = result[0]._id;
  						console.log('session >>>>>>>>>>>>>>>>>>'+req.session.uid);
					  });


				}
			else
				{
					res.send(err);
				}
		}
	});
};

//save blog content editable
  exports.saveblog=function(req,res) {
  const headData = req.body.headData;
  const bodyData = req.body.bodyData;
  var myData = new BlogDB({BlogHead:headData,BlogBody:bodyData});
  
  /* embedded relation without reference (do not delete)
  
  userDB.find({FirstName:"skms"}).then(function(record){
	   
	   record.blogs.push({BlogHead:headData,BlogBody:bodyData});
	   record.save().then(function(){
		   console.log('saved successfully');
		   
	   });
   });
  */
  
  
   myData.save(function(err, task) {
    if (err || task.length === 0)
	{
      res.send(err);
	  }
	  else
	  {
		  var result ={ FirstName: 'skms'};
		  console.log('got:-  '+task.id);
		  var blogID = { blogIDs :task.id }
	userDB.updateOne(result,{$push : blogID},function(err, result) {
		if (err) {console.log('Error saving Id');throw err;}	
		res.send('Updated the information')
	});
	//userDB.update({FirstName:"skms"},{blogIDs:task.id});
    //res.json(task);
	
	//console.log(`skms added:-  POST request: username is ${username} and password is ${password}`);
 // res.end(`Inserted blog`);
  }
  
 
  
  });
  if(req.session.username)
  {
 //handle session and then 
  }
  else
  {
	  console.log('No session ID found...');
  }
  };
  
  
exports.showDashboard= function(req,res)
{
  console.log('Dashboard username >>>>>>>>>>>>>>>'+req.session.username);
  if(req.session.username)
	{

		 /* iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii */

		var result1 = {};
		var result2 = {};  	

		var query = { Email: req.session.username };

		var promise = userDB.find(query,function(err, result) {
		    if (err) throw err;
		  }).then(function (data){
		  		Object.keys(data).forEach(function(key) {
 					result1[key] = data[key];
 				});	
		  });

		  var query = { };
		   var mysort = { CreatedDate : -1 };	
		  var promise = blog.find(query,function(err, result){
		  		if(err) throw err;
		  		console.log(result);
		  }).sort(mysort).then(function(data){
		  		Object.keys(data).forEach(function(key) {
 					result2[key] = data[key];
 				});	
		  }).then(function (data){
		  		res.render('home.html',{
		   			userdetail : result1[0],
		   			blogdetail : result2})
		  });	
	
	}
  else
	{
		res.render('index.html');
	}
   
}

exports.saveInformationStat = function(req,res){

	var query = { Email: req.session.username};
	console.log(query );
	console.log('req.body.ContributeIn >>>>>>>>>>'+req.body.ContributeIn );
	console.log(req.body);
	var newvalue = { ContributeIn : req.body.ContributeIn }
	userDB.updateOne(query,newvalue,function(err, result) {
		if (err) throw err;	
		res.send('Updated the information')
	});

}

exports.saveProfilePic	 = function(req,res){
    
	var storage =   multer.diskStorage({
	  destination: function (req, file, callback) {
	    callback(null, './public/Images');
	  },
	  filename: function (req, file, callback) {
	   	callback(null, req.session.username+'.jpg');
	  }
	});
	var upload = multer({ storage : storage}).single('userPhoto');
	    upload(req,res,function(err) {
	        if(err) {
	        	console.log('err >>>>>>>>>>>'+err);
	            return res.end("Error uploading file.");
	        }
	        
			var query = { Email: req.session.username};
			var newvalue = { profileImage : './public/Images/'+req.session.username+'.jpg' }
			userDB.updateOne(query,newvalue,function(err, result) {
				if (err) throw err;	
				});

	         res.end("File is uploaded");
	    });
}

exports.adminPanel  = function(req,res){
	userDB.find({},function(err, result){
		if(err) throw err;
		res.render('adminPanel.html',{
			data : result,
		});
	});	
}
  
exports.blogsetup = function(req,res)
{

	 console.log('Dashboard called');
  	if(req.session.username){
		var result1 = {};
		var result2 = {};  	

		var query = { Email: req.session.username };

		var promise = userDB.find(query,function(err, result) {
		    if (err) throw err;
		  }).then(function (data){
		  		Object.keys(data).forEach(function(key) {
 					result1[key] = data[key];
 				});	
		  });

		  var query = { CreatedBy : req.session.username };
		   var mysort = { CreatedDate : -1 };	
		  var promise = blog.find(query,function(err, result){
		  		if(err) throw err;
		  }).sort(mysort).then(function(data){
		  		Object.keys(data).forEach(function(key) {
 					result2[key] = data[key];
 				});	
		  }).then(function (data){
		  		res.render('blog.html',{
		   			userdetail : result1[0],
		   			blogdetail : result2})
		  });
		
		 }
	
  else{
		res.render('index.html');
	}
}	

exports.blogcreation = function(req,res){

	 	console.log('Dashboard called');
		
  		if(req.session.username)
		{
		var query = { Email: req.session.username };

		 userDB.find(query,function(err, result) {
		    if (err) throw err;
		 	
		   res.render('blogcreation.html',{
		   			userdetail : result[0],
		   });	  
		  });
		}
  		else
		{
		res.render('index.html');
		}
	
}	
  
exports.logout= function(req,res)
{
	req.session.destroy(function(){
      console.log("user logged out.")
	});
	// res.sendFile('D:/skmsMongo/FirstProj'+ '/index.html');
	
	res.render('index.html');
 }
  
  
exports.adminPanelEditPage = function(req,res){
	if(req.body.mode == 'delete'){
		userDB.remove({ _id : req.body.id }, function(err, result){
			if(err) throw err;
				res.send(result);
		});
	}
	else if(req.body.mode == 'deleteConform'){
		var query = { _id: req.body.id };
		 userDB.find(query,function(err, result) {
		    if (err) throw err;
		
		    if(!result[0]){ 
		    	res.send({ result:''  });	
				}
			else{
				 res.send({ result:result[0] });	
				}
		  });
		}
}

exports.createblog = function(req,res){
	console.log(req.session.uid);
	console.log(req.session.username);
	var blogdata = new blog({Heading:req.body.Heading, Intro:req.body.Intro, blog: req.body.blog, CreatedBy: req.session.username, CreatedDate: new Date(), userid: req.session.uid});
  	blogdata.save(function(err, task) {
    	if (err || task.length === 0)
			{
			res.send(err);
			}
			res.send('done');
		});	
} 

exports.showblog = function(req, res){
	console.log(req.params.id);
	console.log(req.session);
	if(req.session.username){
		var result1 = {};
		var result2 = {};  	

		var query = { Email: req.session.username };

		var promise = userDB.find(query,function(err, result) {
		    if (err) throw err;
		  }).then(function (data){
		  		Object.keys(data).forEach(function(key) {
 					result1[key] = data[key];
 				});	
		  });
		  console.log(result1);
		  var query = { _id : req.params.id };
		  var promise = blog.find(query,function(err, result){
		  		if(err) throw err;
		  }).then(function(data){
		  		Object.keys(data).forEach(function(key) {
 					result2[key] = data[key];
 				});	
		  }).then(function (data){
		  	console.log(result2);
		  		res.render('blogdetail.html',{
		   			userdetail : result1[0],
		   			blog : result2})
		  });
		console.log(result2);
		 }
	
  else{
		res.render('index.html');
	}
}

