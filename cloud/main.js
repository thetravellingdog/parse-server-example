
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi there knob face!');
});

Parse.Cloud.beforeSave(Parse.User, function(request, response) {

  if (!request.object.get("Time01")) {
    request.object.set("Time01", 9999);
    request.object.set("Time02", 9999);
    request.object.set("Time03", 9999);
    request.object.set("Time04", 9999);
    request.object.set("Time05", 9999);
  }
  if (!request.object.get("GamesPlayed")) {
    request.object.set("GamesPlayed", 0);
  }
  if (!request.object.get("Wins")) {
    request.object.set("Wins", 0);
  }
  if (!request.object.get("Losses")) {
    request.object.set("Losses", 0);
  }
  if (!request.object.get("Juggings")) {
    request.object.set("Juggings", 0);
  }
  if (!request.object.get("GivenUp")) {
    request.object.set("GivenUp", 0);
  }
  if (!request.object.get("AverageGameTime")) {
    request.object.set("AverageGameTime", 0);
  }
  if (!request.object.get("AverageWinTime")) {
    request.object.set("AverageWinTime", 0);
  }
  if (!request.object.get("Row")) {
    request.object.set("Row", 99);
  }
  if (!request.object.get("Rank")) {
    	request.object.set("Rank", 99.99); //99.99 used to identify user as not yet completing the game
    	// Update the global user rankings
	Parse.Cloud.run('updateRanks', {}, {
  		success: function(result) {
    			// Success
  		},
  		error: function(error) {
			// Error
  		}
	});
  }

  response.success();

});


Parse.Cloud.define("numberOfUsers", function(request, response) {

	var query = new Parse.Query("User");
	query.count({
  	success: function(number) {
		response.success(number);
  	},
  	error: function(error) {
    		// error is an instance of Parse.Error.
  	}
	});

});


Parse.Cloud.define("globalScoreList", function(request, response) {

	var records = 20;
	var string = "";
	var queryUser = new Parse.Query("User");
 	queryUser.equalTo("objectId", request.params.objectId);
  	queryUser.first({
    		success: function(user) {
			var rank = user.get("Rank");
			var row = user.get("Row");
			if (row <= 25 || rank == 99.99) {
				if (row > 20) {
					records = 25;
				}
				var query = new Parse.Query("User");
				query.limit(records);
				query.ascending('Rank,username');
				query.find({
			  		success: function(results) {
				    		// Create a string of scores to send back to the calling device
    						for (var i = 0; i < results.length; i++) { 
      							var object = results[i];
							string += object.get('Rank') + "#,&" + object.get('username') + "#,&";
							if (object.get('Time01') == 9999) {
								string += "Yet to record a time - ??" + "#,&";
							} else {
      								string += object.get('Time01').toFixed(2) + "#,&";
							}
    						}
    						response.success(string);
  					},
  					error: function(error) {
    						response.error("Error1: " + error.code + " " + error.message);
  					}
				});

			} else {
				// Send back the top 20 plus 5 including the user
				var query = new Parse.Query("User");
				query.limit(records);
				query.ascending('Rank,username');
				query.find({
  					success: function(results) {
	    					// Create a string of scores to send back to the calling device
    						for (var i = 0; i < results.length; i++) { 
      							var object = results[i];
							string += object.get('Rank') + "#,&" + object.get('username') + "#,&";
							if (object.get('Time01') == 9999) {
								string += "Yet to record a time - ??" + "#,&";
							} else {
      								string += object.get('Time01').toFixed(2) + "#,&";
							}
    						}
  					},
  					error: function(error) {
    						response.error("Error2: " + error.code + " " + error.message);
  					}
				});
				var queryList = new Parse.Query("User");
				queryList.limit(5);
				queryList.skip(row - 3);
				queryList.ascending('Row,username');
				queryList.find({
	  				success: function(results) {
		    				// Create a string of users scores to send back to the calling device
	    					for (var i = 0; i < results.length; i++) { 
      							var object = results[i];
							string += object.get('Rank') + "#,&" + object.get('username') + "#,&";
							if (object.get('Time01') == 9999) {
								string += "Yet to record a time - ??" + "#,&";
							} else {
      								string += object.get('Time01').toFixed(2) + "#,&";
							}
    						}
						// Add number of rows to display
						string += "Section1Rows-" + results.length;
    						response.success(string);
  					},
  					error: function(error) {
    						response.error("Error3: " + error.code + " " + error.message);
		  			}
				});
			}
		},
    		error: function() {
			response.error("Error4: ?? / " + count);
   		}
  	});

});


Parse.Cloud.define("updateUser", function(request, response) {

	// Breakdown of the Stats array...
	// 0 - Users Ranking
        // 1 - Number of Juggs players around the world
        // 2 - Ranking text from Parse
	// The following stats are reset after a successful sync with Parse
        // 3 - Number of games dealt
        // 4 - Number of wins
        // 5 - Number of losses
        // 6 - Number of Juggings
        // 7 - Number of times you've given up
        // 8 - Average game time - wins and losses
	// 9 - Average game time - wins only

	// The Master Key must be used to edit the Users Class
	Parse.Cloud.useMasterKey();

	var updateRanks = false;
	var query = new Parse.Query(Parse.User);
 	query.equalTo("objectId", request.params.objectId);
  	query.first({
    		success: function(user) {
			var currentTime = user.get("Time01");
			var newTime = parseFloat(request.params.bestTime);
			if (newTime < currentTime) {
				// Shift the times down and insert the new best time
				user.set("Time05", user.get("Time04"));
				user.set("Time04", user.get("Time03"));
				user.set("Time03", user.get("Time02"));
				user.set("Time02", user.get("Time01"));
				user.set("Time01", newTime);
				updateRanks = true;
				// Update the global user rankings
				Parse.Cloud.run('updateRanks', {}, {
  					success: function(result) {
    						// Success
  					},
  					error: function(error) {
						// Error
  					}
				});
			}
			// Update the users average times
			var serverCount = user.get("Wins") + user.get("Losses");
			var deviceCount = request.params.stats[4] + request.params.stats[5];
			user.set("AverageGameTime", ((user.get("AverageGameTime") * serverCount) + (request.params.stats[8] * deviceCount)) / (serverCount + deviceCount));
			serverCount = user.get("Wins");
			deviceCount = request.params.stats[4];
			user.set("AverageWinTime", ((user.get("AverageWinTime") * serverCount) + (request.params.stats[9] * deviceCount)) / (serverCount + deviceCount));

			// Update the Users stats
			user.set("GamesPlayed", user.get("GamesPlayed") + request.params.stats[3]);
			user.set("Wins", user.get("Wins") + request.params.stats[4]);
			user.set("Losses", user.get("Losses") + request.params.stats[5]);
			user.set("Juggings", user.get("Juggings") + request.params.stats[6]);
			user.set("GivenUp", user.get("GivenUp") + request.params.stats[7]);
			user.save();
      			response.success("User updated");
    		},
    		error: function() {
      			response.error("updateUsersBestTime - couldn't find userId");
    		}
  	});

});


Parse.Cloud.define("updateRanks", function(request, response) {

	var query = new Parse.Query(Parse.User);
	query.ascending('Time01');
	query.find({
  		success: function(users) {
			var rank = 0;
			var previous = 0;
			var delta = 1;
    			for (var i = 0; i < users.length; i++) {
				// Check previous time to see if the rankings should be the same
				if (i > 0 && previous == users[i].get("Time01")) {
					delta += 1;
				} else {
					rank += delta;
					delta = 1;
				}
				users[i].set("Rank", rank);
      				users[i].set("Row", i + 1);
				previous = users[i].get("Time01");
    			}
			Parse.Object.saveAll(users, {
                		useMasterKey: true,
                		success: function(result) {
                    			response.success("User ranks updated");
                		},
                		error: function(error) {
                    			response.error(error);
               	 		}
            		});
  		},
  		error: function(error) {
			response.error(error);
  		}
	});

});


// Used to update the rankings via a Job in case the 'updateUser' call didn't work
Parse.Cloud.job("updateRanksJob", function(request, status) {

	// Update the global user rankings
	Parse.Cloud.run('updateRanks', {}, {
  		success: function(result) {
  	  		// Success
			status.success("updateRatesJob successfully completed");
  		},
  		error: function(error) {
			// Error
			status.error(error);
  		}
	});

});


Parse.Cloud.define("getUsersRank", function(request, response) {

	// The Master Key must be used to edit the Users Class
	Parse.Cloud.useMasterKey();

	var countQuery = new Parse.Query("User");
	countQuery.count({
  		success: function(count) {
    			var query = new Parse.Query("User");
 			query.equalTo("objectId", request.params.objectId);
  			query.first({
    				success: function(user) {
					var rank = user.get("Rank");
					var message = "";
					if (rank > 0 && rank != 99.99) {
						var prefix = rank + " / " + count + " / ";
						switch (rank) {
						    case 1:
						        message = prefix + "King of Juggs! 1st of " + numberWithCommas(count) + "!";
						        break;
						    case 2:
						        message = prefix + "2nd place! (of " + numberWithCommas(count) + " worldwide!)";
						        break;
						    case 3:
						        message = prefix + "3rd place! (of " + numberWithCommas(count) + " worldwide!)";
						        break;
						    default:
							var switchRank = String(rank).slice(-1);
							var checkRank = "";
							var order = "th";
							if (String(rank).length > 1) {
								checkRank = String(rank).slice(-2);
							}
							switch (Number(switchRank)) {
								case 1:
									if (checkRank != "11") {
										order = "st";
									}
									break;
								case 2:
									if (checkRank != "12") {
										order = "nd";
									}
									break;
								case 3:
									if (checkRank != "13") {
										order = "rd";
									}
									break;
								default:
									order = "th";
									break;
							}
						        message = prefix + numberWithCommas(rank) + order + " of " + numberWithCommas(count);
						}
						response.success(message);
						return;
					} else if (rank == 99.99) {
						response.success("You haven't completed the game yet :(");
						return;
					} else {
						response.success("You haven't completed the game yet :(");
						return;
					}
      				},
    				error: function() {
      					response.error("?? / " + count);
    				}
  			});

  		},

  		error: function(error) {
    			response.error("??");
  		}
	});

});


function numberWithCommas(x) {

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

}
