var path = require('path');
var PropertiesReader = require('properties-reader');
var shell = require('shelljs');
var process = require('process');
var fs = require('fs');
const exec = require('child_process').exec;
var pathObject = require("path");
var CronJob = require('cron').CronJob;
var inquirer = require('inquirer');
var moment = require('moment-timezone');
var inputProjectMode;
var os = require('os');
var response = {};
var scheduleJob=false;
var isValidCommand=true;
var isFirstRunForSchedule=false;

testings();
require('events').EventEmitter.defaultMaxListeners = Infinity;

process.stdin.resume();//so the program will not close instantly
function exitHandler(options, exitCode) {
    if (options.exit) {
		console.log("");
		closeApplication((returnvalue) =>{
			if(returnvalue === 'Yes'){
				exports.forcefully=true;
				if(exports.slanguage === "java" || exports.slanguage ==="python"){
					revertModificationOfheadless(exports.sframework,exports.slanguage,exports.sdrivername);
					process.exit();
				}else{
					revertJSTSModificationOfheadless(exports.sframework,exports.slanguage,exports.spath,exports.sdrivername);
					process.exit();
				}
			}else{
				console.log("Please wait for next execution.");
			}
		});
	}
}
function closeApplication(callback) {
	var doYouWantToStop;
	inquirer
	.prompt([{
		type: "list",
		name: 'reptiles',
		prefix: '>',
		message: "Do you want to stop scheduling?",
		choices: ['Yes', 'No'],
	}])
	.then(answers => {
		doYouWantToStop = answers.reptiles;
			if (doYouWantToStop !== undefined && doYouWantToStop !== '' && doYouWantToStop !== null) {
					callback(doYouWantToStop);
			} //check
			else {
				closeApplication();
			}
		});
}

//do something when app is closing
// process.on('exit', exitHandler.bind(null,{cleanup:true}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
// process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
//catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));


function testings() {
    inquirer
        .prompt([{
            type: "list",
            name: 'reptiles',
            prefix: '>',
            message: "Choose project to run on QAS CLI.",
            choices: ['Local system', 'Version control', 'Quit'],
        }])
        .then(answers => {
            inputProjectMode = answers.reptiles;
            console.log('');
            // getInstalledToolsInformation();
            getInstalledToolsInformation(function a(response) {
            });
              //  console.log(response);
                // /shell.exec("cmd /k QAS CLI");
                process.env['qasHeadlessMode'] = 'true';
                process.title = 'QAS CLI';
                if (inputProjectMode === 'Local system') {
                    selectBrowser((returnvalue) => {
                        checkoutFromLocalRepository(returnvalue);
                    });
                } else if (inputProjectMode === 'Version control') {
                    selectBrowser((returnvalue) => {
                        gitCheckout(returnvalue);
                    });
                } else if (inputProjectMode === 'Quit') {
                    console.log("Thanks for using QAS CLI .. ");
                    return;
                } else {
                    console.log('Wrong selection, Please select again');
                }
        });
}

function selectBrowser(callback) {
	var selectedWebDriver;
	inquirer
	.prompt([{
		type: "list",
		name: 'reptiles',
		prefix: '>',
		message: "Select webdriver to run CLI.",
		choices: ['chromeDriver', 'firefoxDriver'],
	}])
	.then(answers => {
		selectedWebDriver = answers.reptiles;
			if (selectedWebDriver !== undefined && selectedWebDriver !== '' && selectedWebDriver !== null) {
					callback(selectedWebDriver);
			} 
			else {
				selectBrowser();
			}
		});
}

function gitCheckout(drivername) {
    var path;
    var isValid = true;
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git for checkout.');
        isValid = false;
    }
    if (isValid) {
        inquirer
            .prompt([{
                type: "input",
                prefix: '>',
                name: "Choose location to store repository"
            }])
            .then(answers => {
                path = answers["Choose location to store repository"];
                if (path !== undefined && path !== '' && path !== null) {
                    path = path.trim().replace(/\\/g, "");
                    if (checkDirectorySync(path)) {
                        console.log("Example : git clone repoURL");
                        processGitClone(path,drivername);
                    } else {
                        console.log('QAS CLI can\'t find the path specified.');
                        console.log('');
                        gitCheckout(drivername);
                    }
                }//check
                else {
                    gitCheckout(drivername);
                }
            });
    }
}

function processGitClone(path,drivername) {
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter git clone command"
        }])
        .then(answers => {
            var cmdPerform = '';
            cmdPerform = answers["Enter git clone command"];
            if (cmdPerform !== undefined && cmdPerform !== '' && cmdPerform !== null) {
                gitCheckoutWithInquer(cmdPerform, path,drivername);
            } else {
                processGitClone(path,drivername);
            }
        });
}

function gitCheckoutWithInquer(cmdPerform, path,drivername) {
    var name = pathObject.parse(cmdPerform).name;
    exports.projectPath = path + "/" + name;
    // exports.projectPath = path;
    process.chdir(path);
    console.log(cmdPerform);
    const a = exec(cmdPerform, function (err, stdout, stderr) {
        if (err) {
            console.log(err);
            processGitClone(path,drivername);
        } else {
            console.log("Clone repository successfully ..");
            // process.chdir(exports.projectPath);
            var projectDetailsFile = exports.projectPath + '/.qas-data/.project';
            if (checkDirectorySync(projectDetailsFile)) {
                shell.exec("chown -R $USER "+exports.projectPath);
                var oldProjectConfiguration = JSON.parse(fs.readFileSync(projectDetailsFile, "utf-8"));
                var oldProjectData = oldProjectConfiguration.projectTypes;
                var language = oldProjectConfiguration.language;
                var framework = oldProjectConfiguration.framework;
                console.log("QAS CLI works only for web and mobile web frameworks.");
                console.log('');
                if (language !== undefined && language !== '' && language === 'java') {
                    // if (setDriver()) {
                        var isValid = true;
                        if (response['mvn'] === null || response['mvn'] === '' || response['mvn'] == 'undefined') {
                            shell.echo('QAS CLI requires maven for execution . Please install apache maven first .');
                            isValid = false;
                        }
                        if (response['java'] === null || response['java'] === '' || response['java'] === 'undefined') {
                            shell.echo('QAS CLI requires java for execution . Please install java.');
                            isValid = false;
                        }
                        if (isValid) {
                            if (framework === 'junit') {
                                process.env["driverDetails"] =drivername;
                                checkJunitReadmeFile(exports.projectPath, function a(response) {
                                    if (response) {
                                        doJavaScriptExecution(exports.projectPath, framework, language,drivername);
                                    } else {
                                        console.log("QAS CLI requires to update your project using QAS import project menu.");
                                        doYouWantToExit();
                                    }
                                });
                            } else {
                                if (checkExistingDriverName(exports.projectPath, drivername, language, framework)) {
                                    if (checkExistingPlatform(exports.projectPath)) {
                                        loadPropertiesFromEachPath(exports.projectPath + "/resources/", true,drivername,function(response){
                                        });
                                        doJavaScriptExecution(exports.projectPath, framework, language,drivername);
                                    } else {
                                        console.log("Project platform is not supported by QAS CLI");
                                        doYouWantToExit();
                                    }
                                } else {
                                    console.log("Enter valid QAS supported driver.name .!");
                                    doYouWantToExit();
                                }
                            }
                        } else {
                            doYouWantToExit();
                        }
                   
                }
                else if (language !== undefined && language !== '' && language === 'python') {
                    var isValid = true;
                    if ((response['python'] === null || response['python'] === '' || response['python'] === 'undefined') &&
                        (response['python3'] === null || response['python3'] === '' || response['python3'] === 'undefined')) {
                        shell.echo('QAS CLI requires python for execution . Please install python first .');
                        isValid = false;
                    }
                    if ((response['pip'] === null || response['pip'] === '' || response['pip'] === 'undefined') &&
                        (response['pip3'] === null || response['pip3'] === '' || response['pip3'] === 'undefined')) {
                        shell.echo('QAS CLI requires pip for python Execution . Please install pip first .');
                        isValid = false;
                    }
                    if (isValid) {
                        if (framework === 'robot') {
                            changePythonRobotProperties(exports.projectPath, true,drivername);
                            executePythonExtraCommand(exports.projectPath, framework, language,drivername);
                        } else {
                            if (checkEnviornmentDriverName(exports.projectPath, drivername, framework)) {
                                if (checkExistingPlatform(exports.projectPath)) {
                                    changePythonBehaveProperties(exports.projectPath, true,drivername);
                                    executePythonExtraCommand(exports.projectPath, framework, language,drivername);
                                } else {
                                    console.log("Project platform is not supported by QAS CLI");
                                    doYouWantToExit();
                                }
                            } else {
                                console.log("Enter valid QAS supported driver.name .!");
                                doYouWantToExit();
                            }
                        }
                    } else {
                        doYouWantToExit();
                    }
                }else if (language !== undefined && language !== '' && language === 'javascript') {
                    var isValid = true;
                    if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                        shell.echo('QAS CLI requires npm for Execution . Please install npm first .');
                        isValid = false;
                    }
                    if (isValid) {
                        var pathOfLatest = '';
                        if (framework === 'jasmine') {
                            pathOfLatest = '/base/updatechrome.js';
                        } else {
                            pathOfLatest = '/source/base/updatechrome.js';
                        }
                        if (checkDirectorySync(exports.projectPath + pathOfLatest)) {
                            if (checkExistingPlatform(exports.projectPath)) {
                                if (framework === 'cucumber') {
                                    if (checkExistingDriverName(exports.projectPath, drivername, language, framework)) {
                                        loadPropertiesFromEachPathTSJS(exports.projectPath + "/resources/", true,drivername,function(response){
                                        });
                                        executeExtraCommand(exports.projectPath, framework, language,drivername);
                                    } else {
                                        console.log("Enter valid QAS supported driver.name .!");
                                        doYouWantToExit();
                                    }
                                } else {
                                    changeJasminProperties(exports.projectPath, true,drivername,"/env.js", function(response){
                                    });
                                    executeExtraCommand(exports.projectPath, framework, language,drivername);
                                }
                            } else {
                                console.log("Project platform is not supported by QAS CLI");
                                doYouWantToExit();
                            }
                        } else {
                            doYouWantToExit();
                        }
                    } else {
                        console.log("QAS CLI requires to update your project using QAS import project menu.");
                        doYouWantToExit();
                    }
                }else if (language !== undefined && language !== '' && language === 'typescript') {
                    var isValid = true;
                    if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                        shell.echo('QAS CLI requires npm for Execution . Please install npm first .');
                        isValid = false;
                    }
                    if (isValid) {
                        var pathOfLatest = '';
                        if (framework === 'jasmine') {
                            pathOfLatest = '/base/updatechrome.ts';
                        } else {
                            pathOfLatest = '/source/base/updatechrome.ts';
                        }
                        if (checkDirectorySync(exports.projectPath + pathOfLatest)) {
                            if (checkExistingPlatform(exports.projectPath)) {
                                if (framework === 'cucumber') {
                                    if (checkExistingDriverName(exports.projectPath, drivername, language, framework)) {
                                        loadPropertiesFromEachPathTSJS(exports.projectPath + "/resources/", true,drivername,function(response){
                                        });
											executeExtraCommand(exports.projectPath, framework, language,drivername);
                                    } else {
                                        console.log("Enter valid QAS supported driver.name .!");
                                        doYouWantToExit();
                                    }
                                } else {
                                    changeJasminProperties(exports.projectPath, true,drivername,"/env.ts",function(response){
                                    });
										executeExtraCommand(exports.projectPath, framework, language,drivername);
                                }
                            } else {
                                console.log("Project platform is not supported by QAS CLI");
                                doYouWantToExit();
                            }
                        } else {
                            console.log("QAS CLI requires to update your project using QAS import project menu.");
                            doYouWantToExit();
                        }
                    } else {
                        doYouWantToExit()
                    }
                } else {
                    console.log("Invalid QAS project in given path.");
                    gitCheckout(drivername);
                }
            } else {
                console.log("It is not valid QAS project")
            }
        }
    });
}

function checkoutFromLocalRepository(drivername) {
    var path = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter project path"
        }])
        .then(answers => {
            path = answers["Enter project path"];
            if (path !== undefined && path !== '' && path !== null) {
                path = path.trim().replace(/\\/g, "");
                var projectDetailsFile = path + '/.qas-data/.project';

                if (checkDirectorySync(projectDetailsFile)) {
                    // shell.exec("chown -R $USER "+path);
                    exports.projectPath = path;
                    var oldProjectConfiguration = JSON.parse(fs.readFileSync(projectDetailsFile, "utf-8"));
                    var oldProjectData = oldProjectConfiguration.projectTypes;
                    var language = oldProjectConfiguration.language;
                    var framework = oldProjectConfiguration.framework;
                    console.log("QAS CLI works only for web and mobile web frameworks.");
                    console.log('');
                    if (language !== undefined && language !== '' && language === 'java') {
                        var isValid = true;
                        if (response['mvn'] === null || response['mvn'] === '' || response['mvn'] == 'undefined') {
                            shell.echo('QAS CLI requires maven for execution . Please install apache maven first');
                            isValid = false;
                        }
                        if (response['java'] === null || response['java'] === '' || response['java'] === 'undefined') {
                            shell.echo('QAS CLI requires java for execution . Please install java.');
                            isValid = false;
                        }
                        if (isValid) {
                            if (framework === 'junit') {
                                process.env["driverDetails"] =drivername;
                                checkJunitReadmeFile(path, function a(response) {
                                    if (response) {
                                        doJavaScriptExecution(path, framework, language,drivername);
                                    }else{
                                        console.log("QAS CLI requires to update your project using QAS import project menu.");
                                        doYouWantToExit();
                                    }
                                });
                            } else {
                                if (checkExistingDriverName(path, drivername, language, framework)) {
                                    if (checkExistingPlatform(path)) {
                                        loadPropertiesFromEachPath(path + "/resources/", true,drivername, function(response){
                                        });
                                        doJavaScriptExecution(path, framework, language,drivername);
                                    } else {
                                        console.log("Project platform is not supported by QAS CLI");
                                        doYouWantToExit();
                                    }
                                } else {
                                    console.log("Enter valid QAS supported driver.name .!");;
                                    doYouWantToExit();
                                }
                            }
                        } else {
                            doYouWantToExit();
                        }
                    }
                    else if (language !== undefined && language !== '' && language === 'python') {
                        var isValid = true;
                        if ((response['python'] === null || response['python'] === '' || response['python'] === 'undefined') &&
                            (response['python3'] === null || response['python3'] === '' || response['python3'] === 'undefined')) {
                            shell.echo('QAS CLI requires python for Execution . Please install python first .');
                            isValid = false;
                        }
                        if ((response['pip'] === null || response['pip'] === '' || response['pip'] === 'undefined') &&
                            (response['pip3'] === null || response['pip3'] === '' || response['pip3'] === 'undefined')) {
                            shell.echo('QAS CLI requires pip for python Execution . Please install pip first .');
                            isValid = false;
                        }
                        if (isValid) {
                            if (framework === 'robot') {
                                changePythonRobotProperties(path, true,drivername);
                                executePythonExtraCommand(path, framework, language,drivername);
                                // doJavaScriptExecution(path, framework, language);
                            } else {
                                if (checkEnviornmentDriverName(exports.projectPath, drivername, framework)) {
                                    if (checkExistingPlatform(path)) {
                                        changePythonBehaveProperties(path, true,drivername);
                                        executePythonExtraCommand(path, framework, language,drivername);
                                        //    doJavaScriptExecution(path, framework, language);
                                    } else {
                                        console.log("Project platform is not supported by QAS CLI");
                                        doYouWantToExit();
                                    }
                                } else {
                                    console.log("Enter valid QAS supported driver.name .!");
                                    doYouWantToExit();
                                }
                            }
                        } else {
                            doYouWantToExit();
                        }
                    }
                    else if (language !== undefined && language !== '' && language === 'javascript') {
                        var isValid = true;
                        if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                            shell.echo('QAS CLI requires npm for Execution . Please install npm first .');
                            isValid = false;
                        }
                        if (isValid) {
                            var pathOfLatest = '';
                            if (framework === 'jasmine') {
                                pathOfLatest = '/base/updatechrome.js';
                            } else {
                                pathOfLatest = '/source/base/updatechrome.js';
                            }
                            if (checkDirectorySync(path + pathOfLatest)) {
                                if (checkExistingPlatform(path)) {
                                    if (framework === 'cucumber') {
                                        if (checkExistingDriverName(path, drivername, language, framework)) {
                                            loadPropertiesFromEachPathTSJS(path + "/resources/", true,drivername,function(response){
                                            });
												executeExtraCommand(path, framework, language,drivername);
                                        } else {
                                            console.log("Enter valid QAS supported driver.name .!");
                                            doYouWantToExit();
                                        }
                                    }
                                    else {
                                        changeJasminProperties(path, true,drivername,"/env.js", function(response){
                                        });
											executeExtraCommand(path, framework, language,drivername);
                                    }
                                } else {
                                    console.log("Project platform is not supported by QAS CLI");
                                    doYouWantToExit();
                                }
                            } else {
                                console.log("QAS CLI requires to update your project using QAS import project menu.");
                                doYouWantToExit();
                            }
                        } else {
                            doYouWantToExit();
                        }
                    }
                    else if (language !== undefined && language !== '' && language === 'typescript') {
                        var isValid = true;
                        if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                            shell.echo('QAS CLI requires npm for Execution . Please install npm first .');
                            isValid = false;
                        }
                        if (isValid) {
                            var pathOfLatest = '';
                            if (framework === 'jasmine') {
                                pathOfLatest = '/base/updatechrome.ts';
                            } else {
                                pathOfLatest = '/source/base/updatechrome.ts';
                            }
                            if (checkDirectorySync(path + pathOfLatest)) {
                                if (checkExistingPlatform(path)) {
                                    if (framework === 'cucumber') {
                                        if (checkExistingDriverName(path, drivername, language, framework)) {
                                            loadPropertiesFromEachPathTSJS(path + "/resources/", true,drivername,function(response){
                                            });
												executeExtraCommand(path, framework, language,drivername);
                                        } else {
                                            console.log("Enter valid QAS supported driver.name .!");
                                            doYouWantToExit();
                                        }
                                    }
                                    else {
                                        changeJasminProperties(path, true,drivername,"/env.ts",function(response){
                                        });
											executeExtraCommand(path, framework, language,drivername);
                                    }
                                } else {
                                    console.log("Project platform is not supported by QAS CLI");
                                    doYouWantToExit();
                                }
                            } else {
                                console.log("QAS CLI requires to update your project using QAS import project menu.");
                                doYouWantToExit();
                            }
                        } else {
                            doYouWantToExit();
                        }
                    }
                    else {
                        console.log("It is not valid  QAS project");
                        checkoutFromLocalRepository(drivername);
                    }
                } else {
                    console.log("QAS CLI can\'t find the path specified.");
                    checkoutFromLocalRepository(drivername);
                }
            }//if check
            else {
                checkoutFromLocalRepository(drivername);
            }
        });
    return;
}
function doJavaScriptExecution(path, framework, language,drivername) {
    process.chdir(path);
    var statementForWebdriver = 'Enter ' + drivername + ' path';
	var driverPath = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: statementForWebdriver
        }])
        .then(answers => {
            driverPath = answers[statementForWebdriver];
            if (driverPath.trim() !== null && driverPath.trim() !== undefined && driverPath.trim() !== '') {
            var spawn_9 = require('child_process').spawn(driverPath.trim(), ['-version']);
            spawn_9.on('error', function (err) {
                // console.log('Error  :'+err);
            });
            var result = '';
            spawn_9.stdout.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_9.stderr.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_9.on('close', function (data) {
                var driver=drivername;
                if(drivername === 'firefoxDriver'){
                    driver='geckodriver';
                }
                if (result.toString().toLowerCase().indexOf(driver.toLowerCase()) == -1) {
                    console.log('Enter valid ' + drivername + ' path.');
                    doJavaScriptExecution(path, framework, language, drivername);
                } else {
                    // executionCommandJava(path, driverPath, framework, language, drivername);
                      askForScheduling(path,driverPath,language,framework,drivername);
                }
            });
         }else {
                doJavaScriptExecution(path, framework, language,drivername);
            }
        });
}
function executePythonExtraCommand(path, framework, language,drivername) {
    var pipalias='';
    if(!((response['python3'] === null || response['python3'] === '' || response['python3'] === 'undefined') 
    && (response['pip3'] === null || response['pip3'] === '' || response['pip3'] === 'undefined')) ){
        pipalias='3';
    }
    process.chdir(path);
    console.log("Please wait while installing required dependencies .");
    shell.exec("pip"+pipalias +" install -r requirements.txt");
    if(framework === 'robot'){
        shell.exec("pip"+pipalias +" install robotframework");
        shell.exec("pip"+pipalias +" install robotframework-appiumlibrary");
    }
    doJavaScriptExecution(path, framework, language,drivername);
}
function executeExtraCommand(path, framework, language,drivername) {
    var path1 = path;
    process.chdir(path);
    console.log("Please wait while installing required dependencies .");
    shell.exec("npm install");
    shell.exec("npm install protractor --save-dev");
    shell.exec("npm install -g tsc");

    if (framework === 'cucumber') {
        shell.exec("npm run webdriver-update"); //cucumber
        if (language == 'typescript') {
			shell.exec("npm run build"); 
		}
    }
    if (framework === 'jasmine') {
        shell.exec("npm run prepare"); //jasmine
        if (language == 'typescript') {
            shell.exec("npm run build"); //typeJasmin
        }
    }
    shell.exec("npm run updatechrome");
    process.title='QAS CLI';
     //Commented scheduling
    askForScheduling(path, '', language, framework, drivername);
    // executionCommandJavaScritpTypescript(path1, framework, language,drivername);
}
function executionCommandJavaScritpTypescript(path, framework, language,drivername) {
    var cmdJavaScript = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter command for execution"
        }])
        .then(answers => {
            cmdJavaScript = answers['Enter command for execution'];
            if (cmdJavaScript !== null && cmdJavaScript !== undefined && cmdJavaScript !== '') {
                if (scheduleJob) {
                    exports.spath=path;
					exports.slanguage=language;
					exports.sframework=framework;
					exports.sdrivername=drivername;
                    cronExecution(path, '', language, framework, drivername, cmdJavaScript);
                } else {
                    exports.isFirstRunForSchedule=false;
                    executeCiCdComandJSAndTS(path, framework, language, drivername, cmdJavaScript);
                }
            } else {
                executionCommandJavaScritpTypescript(path,framework,language,drivername);
            }
        });
}

function revertJSTSModificationOfheadless(framework,language,path,drivername){
    if (framework === "cucumber" && (language === 'typescript' || language === 'javascript')) {
        loadPropertiesFromEachPathTSJS(path + "/resources/", false, drivername,function(response){
        });
    }
    if (framework === "jasmine") {
        var filenameWthLang = "";
        if (language === 'javascript') {
            filenameWthLang = "/env.js";
        } else {
            filenameWthLang = "/env.ts";
        }
        changeJasminProperties(path, false, drivername, filenameWthLang, function (response) {
        });
    }
}
function executionCommandJava(path,chromePath, framework, language,drivername) {
    var cmdJavaScript = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter command for execution"
        }])
        .then(answers => {
            cmdJavaScript = answers['Enter command for execution'];
            if (cmdJavaScript !== null && cmdJavaScript !== undefined && cmdJavaScript !== '') {
                if (scheduleJob) {
                    exports.spath=path;
					exports.slanguage=language;
					exports.sframework=framework;
					exports.sdrivername=drivername;
                    cronExecution(path, chromePath, language, framework, drivername, cmdJavaScript);
                } else {
                    executeCiCdComandJavaAndPython(path, chromePath, framework, language, drivername, cmdJavaScript);
                }
            } else {
                executionCommandJava(path,chromePath,framework,language,drivername);
            }
        });
}
function revertModificationOfheadless(framework,language,drivername){
    if (framework == "robot") {
        changePythonRobotProperties(exports.projectPath, false, drivername);
    }
    if (framework == "behave") {
        changePythonBehaveProperties(exports.projectPath, false, drivername);
    }
    if (language === 'java' && framework !== "junit") {
        loadPropertiesFromEachPath(exports.projectPath + "/resources/", false, drivername,function(response){
        });
    }
}
function checkDirectorySync(directory) {
    try {
        fs.statSync(directory);
        return true;
    }
    catch (e) {
        return false;
    }
}
function checkExistingPlatform(path){
    if (checkDirectorySync(path+ '/resources/application.properties')) {
        var properties = PropertiesReader(path + '/resources/application.properties');
        var platformType=properties.get('platform');
        if(platformType === 'web' || platformType === 'mobileweb'){
                return true;
        }else{
            return false;
        }
    } else {
        console.log("Project is Invalid .");
        return false;
    }
}
function checkExistingDriverName(path,driver ,projectType,framework){
	if (checkDirectorySync(path+ '/resources/application.properties')) {
		var properties = PropertiesReader(path + '/resources/application.properties');
		var driverName=properties.get('driver.name');
		if((driverName === '' || driverName === undefined || driverName === null) ){
			return false;
		}else if(!(['firefoxdriver', 'chromedriver','safaridriver'].includes(driverName.toLowerCase()))){
			return false;
		}else{
			if(projectType === 'java'){
				var temp=checkEnviornmentDriverName(path,driver,framework);
				return temp;
			}else{
				return true; //Don't Do for TS JS
			}
		}
	} 
	else {
		console.log("Project is Invalid .");
		return false;
	}
}
function checkEnviornmentDriverName(path,driver,framework){
	var isExist=false;
		var platforms;
			if(framework!== 'qaf'){
				platforms = ['web', 'mobileweb'];
			}else{
				platforms =['web'];
			}
	   platforms.forEach(function (element) {
			var platformDir = path + "/resources/" + element + "/";
				if (fs.existsSync(platformDir)) {
					var properties = PropertiesReader(platformDir + "env.properties");
					var driverName=properties.get('driver.name');
					if((driverName === '' || driverName === undefined || driverName === null) ){
						isExist=false;
                    }else if(!(['firefoxdriver', 'chromedriver','safaridriver'].includes(driverName.toLowerCase()))){
						isExist=false;
					}else{
						isExist=true;
					}
				}
		   });
		   return isExist;
}

function changePythonBehaveProperties(path, isSave,drivername) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/resources/" + element + "/";
        if (fs.existsSync(platformDir)) {
            try{
                fs.readdirSync(platformDir).forEach(function (file) {
                    if (file.search("env.properties") !== -1) {
                        var property = new PropertiesReader(platformDir + "env.properties");
                        var objectValueMap = property.getAllProperties();
                        var scaps = objectValueMap['chrome.additional.capabilities'].toString().replace(/\\/g, "");
                        objectValueMap['chrome.additional.capabilities'] = JSON.parse(scaps);
                        if (isSave) {
                            if (drivername === 'firefoxDriver') {
                                objectValueMap['driver.name'] = drivername;
                                if (element !== 'mobileweb') {
                                    objectValueMap['firefox.additional.capabilities'] = '{"browserName": "firefox","marionette": "True", "acceptInsecureCerts": "True","moz:firefoxOptions":{"args":["--headless"]}}';
                                } else {
                                    objectValueMap['firefox.additional.capabilities'] = { 'moz:firefoxOptions': { "args": ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] } };
                                }
                            } else {
                                if (element !== 'mobileweb') {
                                    objectValueMap['chrome.additional.capabilities'] = { 'goog:chromeOptions': { "args": ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] } };
                                } else {
                                    objectValueMap['chrome.additional.capabilities'] = { "goog:chromeOptions": { "mobileEmulation": { "deviceName": "Pixel 2" }, "args": ["--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"] } };
                                }
                            }
                        } else {
                            if (drivername === 'firefoxDriver') {
                                objectValueMap['driver.name'] = 'chromeDriver';
                                delete objectValueMap['firefox.additional.capabilities'];
                            } else {
                                if (element !== 'mobileweb') {
                                    objectValueMap['chrome.additional.capabilities'] = { args: ['--start-maximized'] };
                                } else {
                                    objectValueMap['chrome.additional.capabilities'] = { "chromeOptions": { "mobileEmulation": { "deviceName": "Pixel 2" } } };
                                }
                            }
                        }
                        var str = '';
                        for (var i in objectValueMap) {
                            var key = typeof objectValueMap[i] === 'object' ? JSON.stringify(objectValueMap[i]) : objectValueMap[i];
                            str += i + '=' + key + '\n';
                        }
                        saveEnvFile(str, platformDir + "env.properties", function (fileRes) {
                            console.log(fileRes);
                        });
                    }
                });
        }catch(err){
            if(err.toString().indexOf('EACCES: permission denied') >-1){
                console.log('ERROR: Please give read permission to the project for further execution.' );
            }
            doYouWantToExit();
        }
        }
    });
}

function changePythonRobotProperties(path, isSave,drivername) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/steps/" + element + "/";
        if (fs.existsSync(platformDir)) {
            try{
                if (isSave) {
                    if (drivername === 'firefoxDriver') {
                        if (element === 'mobileweb') {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("${options}=         Get Chrome Mobile Options", ' ${options}=         Evaluate    sys.modules[\'selenium.webdriver\'].FirefoxOptions()    sys, selenium.webdriver \n  Call Method    ${options}    add_argument    --headless \n  Call Method    ${options}    add_argument    --disable-gpu \n  Call Method    ${options}    add_argument    --no-sandbox \n  Call Method    ${options}    add_argument    --disable-dev-shm-usage'));
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("Chrome                       chrome_options=${options}", 'Firefox                       firefox_options=${options}'));
                        } else {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace(" ${BROWSER}", 'headlessfirefox'));
                        }
                    } else {
                        if (element === 'mobileweb') {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("${options}=         Get Chrome Mobile Options", ' ${options}=         Get Chrome Mobile Options \n  Call Method    ${options}    add_argument    --headless \n  Call Method    ${options}    add_argument    --disable-gpu \n  Call Method    ${options}    add_argument    --no-sandbox \n  Call Method    ${options}    add_argument    --disable-dev-shm-usage'));
                        } else {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace(" ${BROWSER}", 'headlesschrome'));
                        }
                    }
                }
                else {
                    if (drivername === 'firefoxDriver') {
                        if (element === 'mobileweb') {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("${options}=         Evaluate    sys.modules[\'selenium.webdriver\'].FirefoxOptions()    sys, selenium.webdriver \n  Call Method    ${options}    add_argument    --headless \n  Call Method    ${options}    add_argument    --disable-gpu \n  Call Method    ${options}    add_argument    --no-sandbox \n  Call Method    ${options}    add_argument    --disable-dev-shm-usage", '${options}=         Get Chrome Mobile Options'));
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("Firefox                       firefox_options=${options}", 'Chrome                       chrome_options=${options}'));
                        } else {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("headlessfirefox", ' ${BROWSER}'));
                        }
                    } else {
                        if (element === 'mobileweb') {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("  Call Method    ${options}    add_argument    --headless \n  Call Method    ${options}    add_argument    --disable-gpu \n  Call Method    ${options}    add_argument    --no-sandbox \n  Call Method    ${options}    add_argument    --disable-dev-shm-usage", ''));
                        } else {
                            fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("headlesschrome", ' ${BROWSER}'));
                        }
                    }
                }
            } catch (err) {
                if (err.toString().indexOf('EACCES: permission denied') > -1) {
                    console.log('ERROR: Please give read permission to the project for further execution.');
                }
                doYouWantToExit();
            }
        }
    });
}
function changeJasminProperties(path, isSave,drivername,filename,callback){
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/resources/" + element + "/";
        try {
            if (fs.existsSync(platformDir)) {
                if (isSave) {
                    if (drivername === 'firefoxDriver') {
                        if (element === 'web') {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("browserName: 'chrome'", "browserName: 'firefox',\n 'moz:firefoxOptions': {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}"));
                        } else {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}", "moz:firefoxOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}"));
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("browserName: 'chrome'", "browserName: 'firefox'"));
                        }
                    } else {
                        if (element === 'web') {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("browserName: 'chrome'", "browserName: 'chrome',\n chromeOptions: {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}"));
                        } else {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}", "'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}"));
                        }
                    }
                    callback("saved");
                } else {
                    if (drivername === 'firefoxDriver') {
                        if (element === 'web') {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("browserName: 'firefox',\n 'moz:firefoxOptions': {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}", "browserName: 'chrome'"));
                        } else {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("moz:firefoxOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}", "chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}"));
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("browserName: 'firefox'", "browserName: 'chrome'"));
                        }
                    } else {
                        if (element === 'web') {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("browserName: 'chrome',\n chromeOptions: {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}", "browserName: 'chrome'"));
                        } else {
                            fs.writeFileSync(platformDir + filename, fs.readFileSync(platformDir + filename, 'utf8').replace("'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}", "'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}"));
                        }
                    }
                    callback("saved");
                }
            }
        } catch (err) {
            if (err.toString().indexOf('EACCES: permission denied') > -1) {
                console.log('ERROR: Please give read permission to the project for further execution.');
            }
            doYouWantToExit();
        }
    });
}

function loadPropertiesFromEachPathTSJS(path, isSave,drivername,callback) {
    changeDriverNameInApplicationProperties(path, drivername, isSave, function (result) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/" + element + "/";
        try {
            if (fs.existsSync(platformDir)) {
                fs.readdirSync(platformDir).forEach(function (file) {
                    if (file.search("env.properties") !== -1) {
                        var property = new PropertiesReader(platformDir + "env.properties");
                        var objectValueMap = property.getAllProperties();
                        if (objectValueMap['chrome.additional.capabilities'] !== undefined) {
							var scaps = objectValueMap['chrome.additional.capabilities'].toString().replace(/\\/g, "");
							objectValueMap['chrome.additional.capabilities'] = JSON.parse(scaps);
						} else {
							objectValueMap['chrome.additional.capabilities'] = "";
						}
                        if (isSave) {
                            if (drivername === 'firefoxDriver') {
                                objectValueMap['firefox.additional.capabilities'] = '{"moz:firefoxOptions":{"args":["--headless"],"mobileEmulation":{"deviceName":"iPhone X"}}}';
                            } else {
                                if (Object.keys(objectValueMap['chrome.additional.capabilities']).length === 0) {
                                    objectValueMap['chrome.additional.capabilities'] = {
                                        chromeOptions: {
                                            args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
                                        }
                                    };
                                }
                                else {
                                    objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'] = ["--headless", "--no-sandbox", "--disable-dev-shm-usage"];
                                }
                            }
                        }
                        else {
                            if (drivername === 'firefoxDriver') {
                                delete objectValueMap['firefox.additional.capabilities'];
                            } else {
                                if (element !== 'mobileweb') {
                                    delete objectValueMap['chrome.additional.capabilities'].chromeOptions;
                                } else {
                                    delete objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'];
                                }
                            }
                        }
                        var str = '';
                        for (var i in objectValueMap) {
                            var key = typeof objectValueMap[i] === 'object' ? JSON.stringify(objectValueMap[i]) : objectValueMap[i];
                            str += i + '=' + key + '\n';
                        }
                        callback("fileRes");
                        saveEnvFile(str, platformDir + "env.properties", function (fileRes) {
                            console.log(fileRes);
                            callback(fileRes);
                        });
                        
                    }else{
                        callback("result not file search");
                    }
                });
            }
        } catch (err) {
            if (err.toString().indexOf('EACCES: permission denied') > -1) {
                console.log('ERROR: Please give read permission to the project for further execution.');
            }
            doYouWantToExit();
        }
    });
});
}
function loadPropertiesFromEachPath(path, isSave,drivername,callback) {
    changeDriverVariableInApplicationProperties(path, drivername, isSave, function (response) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/" + element + "/";
             try{
                if (fs.existsSync(platformDir)) {
                    fs.readdirSync(platformDir).forEach(function (file) {
                        if (file.search("env.properties") !== -1) {
                            var property = new PropertiesReader(platformDir + "env.properties");
                            var objectValueMap = property.getAllProperties();
                            if (objectValueMap['chrome.additional.capabilities'] !== undefined) {
                                var scaps = objectValueMap['chrome.additional.capabilities'].toString().replace(/\\/g, "");
                                objectValueMap['chrome.additional.capabilities'] = JSON.parse(scaps);
                            } else {
                                objectValueMap['chrome.additional.capabilities'] = "";
                            }
                            if (isSave) {
                                if (drivername === 'firefoxDriver') {
                                    if (element !== 'mobileweb') {
                                        objectValueMap['driver.name'] = drivername;
                                        objectValueMap['firefox.additional.capabilities'] = '{"moz:firefoxOptions":{"args":["--headless"],"mobileEmulation":{"deviceName":"iPhone X"}}}';
                                    } else {
                                        objectValueMap['driver.name'] = drivername;
                                        objectValueMap['firefox.additional.capabilities'] = '{"moz:firefoxOptions":{"args":["--headless"],"mobileEmulation":{"deviceName":"iPhone X"}}}';
                                    }
                                } else {
                                    if (objectValueMap['chrome.additional.capabilities'] === undefined) {
                                        objectValueMap['chrome.additional.capabilities'] = {
                                            chromeOptions: {
                                                args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
                                            }
                                        };
                                    }
                                    if (Object.keys(objectValueMap['chrome.additional.capabilities']).length === 0) {
                                        objectValueMap['chrome.additional.capabilities'] = {
                                            chromeOptions: {
                                                args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
                                            }
                                        };
                                    }
                                    else {
                                        objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'] = ["--headless", "--no-sandbox", "--disable-dev-shm-usage"];
                                    }
                                }
                            }
                            else {
                                if (drivername === 'firefoxDriver') {
                                    if (element !== 'mobileweb') {
                                        objectValueMap['driver.name'] = 'chromeDriver';
                                        delete objectValueMap['firefox.additional.capabilities'];
                                    } else {
                                        objectValueMap['driver.name'] = 'chromeDriver';
                                        delete objectValueMap['firefox.additional.capabilities'];
                                    }
                                } else {
                                    if (element !== 'mobileweb') {
                                        delete objectValueMap['chrome.additional.capabilities'].chromeOptions;
                                    } else {
                                        delete objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'];
                                    }
                                }
                            }
                            var str = '';
                            for (var i in objectValueMap) {
                                var key = typeof objectValueMap[i] === 'object' ? JSON.stringify(objectValueMap[i]) : objectValueMap[i];
                                str += i + '=' + key + '\n';
                            }
                            callback("fileRes");
                            saveEnvFile(str, platformDir + "env.properties", function (fileRes) {
                                console.log(fileRes);
                            });
                        }else{
                            callback("result not file search");
                        }
                    });
                }
        }catch(err){
            if(err.toString().indexOf('EACCES: permission denied') >-1){
                console.log('ERROR: Please give read permission to the project for further execution.' );
            }
            doYouWantToExit();
        }
    });
});
}
function saveEnvFile(content, fileToWrite, callback) {
    fs.existsSync(fileToWrite);
    fs.writeFileSync(fileToWrite, content, function (err) {
        if (err) {
            if(err.toLowerCase().indexOf('EACCES: permission denied') >-1){
            console.log('ERROR: Please give read permission to the project for further execution.' );
            }
            callback({ success: false, errMessage: err });
        }
        else {
            callback({ success: true });
            console.log('complete');
        }
    });
}
exports.saveEnvFile = saveEnvFile;

function getInstalledToolsInformation(callback) {
    // callback({ "java": "1.8.0", "npm": "6.4.0", ".net": null });

    getJavaVersion(function (err, version) {
        // console.log("Java: " + version);
        response['java'] = version;
        getNodeVersion(function (err, version) {
            // console.log("node: " + version);
            response['node'] = version;
            getPythonVersion(function (err, version) {
                // console.log("python: " + version);
                response['python'] = version;
                getMvnVersion(function (err, version) {
                    // console.log("mvn: " + version);
                    response['mvn'] = version;
                    getPipVersion(function (err, version) {
						// console.log("pip: " + version);
                        response['pip'] = version;
                        getPython3Version(function (err, version) {
                            // console.log("python: " + version);
                            response['python3'] = version;
                            getPip3Version(function (err, version) {
                                // console.log("pip: " + version);
                                response['pip3'] = version;
                    getNpmVersion(function (err, version) {
                        // console.log("npm: " + version);
                        response['npm'] = version;
                        callback(response);
                    });
                });
                });
                });
                });
            });
        });
    });
}
exports.getInstalledToolsInformation = getInstalledToolsInformation;
function isWin(callback) {
    var plat = process.platform;
    if (plat === 'win32') {
        return callback(null, true);
    }
    else {
        return callback(null, false);
    }
}
exports.isWin = isWin;
function isMac(callback) {
    var plat = process.platform;
    if (plat === 'darwin') {
        return callback(null, true);
    }
    else {
        return callback(null, false);
    }
}
exports.isMac = isMac;
function getJavaVersion(callback) {
    var spawn = require('child_process').spawn('java', ['-version']);
    var result = '';
    var callbackdone = false;
    spawn.on('error', function (err) {
        // console.log('Oh noez, teh errurz: ' + err);
        if (!callbackdone) {
            callbackdone = true;
            return callback(null, null);
        }
    });
    spawn.stdout.on('data', function (data) {
        result += data.toString();
    });
    spawn.stderr.on('data', function (data) {
        result += data.toString();
    });
    spawn.on('close', function (data) {
        data = result.toString().split('\n')[0].split('\r')[0];
        var javaVersion = '';
        if(data.indexOf('openjdk') > -1) {
            javaVersion=new RegExp('openjdk version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
        }else{
            javaVersion=new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
        }
        if (javaVersion !== false) {
            return callback(null, javaVersion);
        }
        else {
            return callback(null, null);
        }
    });
}
exports.getJavaVersion = getJavaVersion;
function getNodeVersion(callback) {
    try {
        var spawn_1 = require('child_process').spawn;
        var child = spawn_1('node', ['--version']);
        var result = '';
        child.stdout.on('data', function (data) {
            result = result + data.toString();
        });
        child.on('close', function (err) {
            result = result.split('\n')[0].split('\r')[0];
            return callback(null, result);
        });
        child.on('error', function (err) {
            // console.log('Oh noez, teh errurz: ' + err);
            return callback(null, null);
        });
    }
    catch (error) {
        return callback(null, null);
    }
}
exports.getNodeVersion = getNodeVersion;
function getPythonVersion(callback) {
    try {
        var spawn_2 = require('child_process').spawn('python', ['--version']);
        var isCallBackDone = false;
        spawn_2.on('error', function (err) {
            if (!isCallBackDone) {
                isCallBackDone = true;
                return callback(err, null);
            }
        });
        spawn_2.stdout.on('data', function (data) {
            data = data.toString().split('\n')[0].split('\r')[0];
            var pythonVersion = new RegExp('Python').test(data) ? data.split(' ')[1].replace(/"/g, '') : false;
            if (pythonVersion !== false) {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, pythonVersion);
                }
            }
            else {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            }
        });
        spawn_2.stderr.on('data', function (data) {
            data = data.toString().split('\n')[0].split('\r')[0];
            var pythonVersion = new RegExp('Python').test(data) ? data.split(' ')[1].replace(/"/g, '') : false;
            if (pythonVersion !== false) {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, pythonVersion);
                }
            }
            else {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            }
        });
    }
    catch (error) {
        return callback(null, null);
    }
}
exports.getPythonVersion = getPythonVersion;
function getPython3Version(callback) {
    try {
        var spawn_2 = require('child_process').spawn('python3', ['--version']);
        var isCallBackDone = false;
        spawn_2.on('error', function (err) {
            if (!isCallBackDone) {
                isCallBackDone = true;
                return callback(err, null);
            }
        });
        spawn_2.stdout.on('data', function (data) {
            data = data.toString().split('\n')[0].split('\r')[0];
            var pythonVersion = new RegExp('Python').test(data) ? data.split(' ')[1].replace(/"/g, '') : false;
            if (pythonVersion !== false) {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, pythonVersion);
                }
            }
            else {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            }
        });
        spawn_2.stderr.on('data', function (data) {
            data = data.toString().split('\n')[0].split('\r')[0];
            var pythonVersion = new RegExp('Python').test(data) ? data.split(' ')[1].replace(/"/g, '') : false;
            if (pythonVersion !== false) {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, pythonVersion);
                }
            }
            else {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            }
        });
    }
    catch (error) {
        return callback(null, null);
    }
}
function getPipVersion(callback) {
    try {
        var spawn_3 = require('child_process').spawn('pip', ['--version']);
        var isCallBackDone = false;
        var result = '';
        spawn_3.on('error', function (err) {
            if (!isCallBackDone) {
                isCallBackDone = true;
                return callback(err, null);
            }
        });
        spawn_3.stdout.on('data', function (data) {
            result = result + data;
        });
        spawn_3.stderr.on('data', function (data) {
            result = result + data;
        });
        spawn_3.on('close', function (data) {
            data = result.toString().split('\n')[0].split('\r')[0];
            var pythonVersion = new RegExp('pip').test(data) ? data.split(' ')[1].replace(/"/g, '') : false;
            if (pythonVersion !== false) {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, pythonVersion);
                }
            }
            else {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            }
        });
    }
    catch (error) {
        return callback(null, null);
    }
}
exports.getPipVersion = getPipVersion;
function getPip3Version(callback) {
    try {
        var spawn_3 = require('child_process').spawn('pip3', ['--version']);
        var isCallBackDone = false;
        var result = '';
        spawn_3.on('error', function (err) {
            if (!isCallBackDone) {
                isCallBackDone = true;
                return callback(err, null);
            }
        });
        spawn_3.stdout.on('data', function (data) {
            result = result + data;
        });
        spawn_3.stderr.on('data', function (data) {
            result = result + data;
        });
        spawn_3.on('close', function (data) {
            data = result.toString().split('\n')[0].split('\r')[0];
            var pythonVersion = new RegExp('pip').test(data) ? data.split(' ')[1].replace(/"/g, '') : false;
            if (pythonVersion !== false) {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, pythonVersion);
                }
            }
            else {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            }
        });
    }
    catch (error) {
        return callback(null, null);
    }
}
function getNpmVersion(callback) {
    try {
        if (process.platform === 'darwin') {
            var spawn_4 = require('child_process').spawn('npm', ['-version']);
            var result = '';
            var isCallBackDone = false;
            spawn_4.stdout.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_4.on('close', function () {
                result = result.split('\n')[0].split('\r')[0];
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, result);
                }
            });
            spawn_4.on('error', function (err) {
                // console.log('Oh noez, teh errurz: ' + err);
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            });
        }
        else if (process.platform === 'win32') {
            var spawn_5 = require('child_process').spawn('node', ['--version']);
            var result = '';
            var isCallBackDone = false;
            spawn_5.stdout.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_5.stderr.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_5.on('close', function () {
                result = result.split('\n')[0].split('\r')[0];
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, result);
                }
            });
            spawn_5.on('error', function (err) {
                // console.log('Oh noez, teh errurz: ' + err);
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            });
        }
        else {
            // process.platform === "linux" || process.platform == "android" || process.platform == "freebsd"
            //TODO Need to verify this on other system types
            try {
                var spawn_6 = require('child_process').spawn('npm', ['-version']);
                spawn_6.stdout.on('data', function (data) {
                    data = data.toString().split('\n')[0].split('\r')[0];
                    return callback(null, data);
                });
                spawn_6.on('error', function (err) {
                    // console.log('Oh noez, teh errurz: ' + err);
                    return callback(null, null);
                });
            }
            catch (error) {
                return callback(null, null);
            }
        }
    }
    catch (error) {
        return callback(null, null);
    }
}
exports.getNpmVersion = getNpmVersion;
function getMvnVersion(callback) {
    //console.log(process.platform);
    try {
        if (process.platform === 'darwin') {
            var spawn_7 = require('child_process').spawn('mvn', ['-version']);
            var result = '';
            var callbackdone = false;
            spawn_7.on('error', function (err) {
                // console.log('Oh noez, teh errurz: ' + err);
                if (!callbackdone) {
                    callbackdone = true;
                    return callback(null, null);
                }
            });
            spawn_7.stdout.on('data', function (data) {
                result += data.toString();
            });
            spawn_7.on('close', function (data) {
                result = result.toString().split('\r')[0].split('\n')[0];
                if (!callbackdone) {
                    callbackdone = true;
                    return callback(null, result);
                }
            });
        }
        else if (process.platform === 'win32') {
            var spawn_8 = require('child_process').spawn('cmd.exe', ['/c', 'mvn -version']);
            var callbackdone = false;
            spawn_8.on('error', function (err) {
                if (!callbackdone) {
                    callbackdone = true;
                    return callback(err, null);
                }
            });
            var result = '';
            spawn_8.stdout.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_8.stderr.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_8.on('close', function (data) {
                result = result.toString().split('\r')[0].split('\n')[0];
                data = result;
                var adbVersion = new RegExp('Apache Maven').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
                if (adbVersion !== false) {
                    if (!callbackdone) {
                        callbackdone = true;
                        return callback(null, adbVersion);
                    }
                }
                else {
                    if (!callbackdone) {
                        callbackdone = true;
                        return callback(null, null);
                    }
                }
            });
        }
        else {
            // process.platform === "linux" || process.platform == "android" || process.platform == "freebsd"
            //TODO Need to verify this on other system types
            var spawn_9 = require('child_process').spawn('mvn', ['-version']);
            var callbackdone = false;
            spawn_9.on('error', function (err) {
                if (!callbackdone) {
                    callbackdone = true;
                    return callback(err, null);
                }
            });
            var result = '';
            spawn_9.stdout.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_9.stderr.on('data', function (data) {
                result = result + data.toString();
            });
            spawn_9.on('close', function (data) {
                result = result.toString().split('\r')[0].split('\n')[0];
                data = result;
                var adbVersion = new RegExp('Apache Maven').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
                if (adbVersion !== false) {
                    if (!callbackdone) {
                        callbackdone = true;
                        return callback(null, adbVersion);
                    }
                }
                else {
                    if (!callbackdone) {
                        callbackdone = true;
                        return callback(null, null);
                    }
                }
            });
        }
    }
    catch (error) {
        return callback(null, null);
    }
}
exports.getMvnVersion = getMvnVersion;
function getAdbVersion(callback) {
    try {
        var spawn_10 = require('child_process').spawn('adb', ['--version']);
        var isCallBackDone = false;
        spawn_10.on('error', function (err) {
            // console.log('Oh noez, teh errurz:adb: ' + err);
            if (!isCallBackDone) {
                isCallBackDone = true;
                return callback(err, null);
            }
        });
        var out = "";
        spawn_10.stdout.on('data', function (data) {
            out = out + data.toString();
        });
        spawn_10.stderr.on('data', function (data) {
            out = out + data.toString();
        });
        spawn_10.on('close', function (data) {
            out = out.split('\n')[0].split('\r')[0];
            var adbVersion = new RegExp('Android Debug Bridge version ').test(out) ? out.split(' ')[4].replace(/"/g, '') : false;
            if (adbVersion !== false) {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, adbVersion);
                }
            }
            else {
                if (!isCallBackDone) {
                    isCallBackDone = true;
                    return callback(null, null);
                }
            }
        });
    }
    catch (error) {
        return callback(null, null);
    }
}
exports.getAdbVersion = getAdbVersion;

    function  doYouWantToExit() {
		process.title='QAS CLI';
		console.log("");
		console.log("");
		var againExecution="";
		inquirer
			.prompt([{
				type: "list",
				name: 'reptiles',
				prefix: '>',
				message: "Process Completed ,Do you want to execute other ?",
				choices: ['yes', 'no']

			}])
			.then(answers => {
				againExecution = answers.reptiles;
				if (againExecution !== undefined && againExecution !== '' && againExecution !== null) {
						if(againExecution === 'yes'){
								testings();
						}else{
							shell.exit(1);
						}
				} 
			});
	}


    function printReportPath(framework, projectPath, callback) {
        if (framework !== 'robot') {
            if (checkDirectorySync(projectPath + '/test-results/meta-info.json')) {
                console.log('');
                console.log('')
                console.log("----------------------------------------------------------------------------------------------");
                console.log(" Report Path ")
                console.log("----------------------------------------------------------------------------------------------");
                console.log('')
                if (framework !== 'robot') {
                    fs.readFile(projectPath + '/test-results/meta-info.json', (err, data) => {
                        if (err) { };
                        let student = JSON.parse(data);
                        var lastValue = student['reports'];
    
                        if (lastValue !== undefined) {
                            var lastDirName = lastValue[0].dir;
                            if (lastDirName !== undefined) {
                                console.log(projectPath + "/" + lastDirName.replace('/json', ''));
                                console.log('')
                                console.log("----------------------------------------------------------------------------------------------");
                                callback(true);
                            }
                        }
                    });
                } else {
                    console.log(projectPath + "/report.html");
                    console.log('')
                    console.log("----------------------------------------------------------------------------------------------");
                    callback(true);
                }
            } else {
                doYouWantToExit();
            }
        } else {
            console.log('');
            console.log('')
            console.log("----------------------------------------------------------------------------------------------");
            console.log(" Report Path ")
            console.log("----------------------------------------------------------------------------------------------");
            console.log('')
            console.log(projectPath + "/report.html");
            console.log('')
            console.log("----------------------------------------------------------------------------------------------");
            callback(true);
        }
    }
    
    function doYouWantToExitWithOptions(path ,chromePath, framework, language,drivername) {
        var isNotValidSchedule = false;
        if (exports.isFirstRunForSchedule) {
            if (!exports.isValidCommand) {
                isNotValidSchedule = true;
            }
        }
        if ((!scheduleJob || isNotValidSchedule)) {
        process.title = 'QAS CLI';
        console.log("");
        console.log("");
        var againExecution = "";
        inquirer
            .prompt([{
                type: "list",
                name: 'reptiles',
                prefix: '>',
                message: "Process completed. Please select ",
                choices: ['Execute other project', 'Execute with other command', 'Quit']
    
    
            }])
            .then(answers => {
                againExecution = answers.reptiles;
                if (againExecution !== undefined && againExecution !== '' && againExecution !== null) {
                    if (againExecution === 'Execute other project') {
                        testings();
                    } else if (againExecution === 'Execute with other command') {
                        if (language === 'java' || language === 'python') {
                            if(language==='java'){
                                if(framework !== 'junit'){
                                    loadPropertiesFromEachPath(path + "/resources/", true,drivername,function(response){
                                    });
                                }
                            }
                            if(language==='python'){
                                if(framework === 'robot'){
                                    changePythonRobotProperties(path, true,drivername);
                                }else{
                                    changePythonBehaveProperties(path, true,drivername);
                                }
                            }
                            executionCommandJava(path, chromePath, framework, language,drivername);
                        }else{
                            if (framework === 'cucumber') {
                                loadPropertiesFromEachPathTSJS(path + "/resources/", true, drivername, function (response) {
                                    executionCommandJavaScritpTypescript(path, framework, language, drivername);
                                });
                            }
                            if (framework === 'jasmine') {
                                var filenameWthLang="";
                                if (language === 'javascript') {
                                    filenameWthLang="/env.js";
                                } else {
                                    filenameWthLang="/env.ts";
                                }
                                changeJasminProperties(path, true,drivername,filenameWthLang, function(response){
                                    executionCommandJavaScritpTypescript(path, framework, language, drivername);
                                });
                            }
                        }
                    } else {
                        shell.exit(1);
                    }
                }
            });
        }
    }
    

    async function checkJunitReadmeFile(path,callback){
        await fs.readFile(path+"//README.md","utf8", (err, data) => {
            if (err) {
                 callback(false);
            }
            if(data.indexOf('firefoxDriver') >= 0){
                 callback(true);
            }else{
                callback(false);
            }
          });
    }
    function changeDriverNameInApplicationProperties(path,driverName,isSave, callback){
        if (driverName === 'firefoxDriver' &&  (fs.existsSync(path)) ) {
            if (checkDirectorySync(path + '/application.properties')) {
                if (isSave) {
                    fs.writeFileSync(path + "/application.properties", fs.readFileSync(path + "/application.properties", 'utf8').replace("driver.name=chromeDriver", "driver.name=firefoxDriver"));
                    callback("done");
                } else {
                    fs.writeFileSync(path + "/application.properties", fs.readFileSync(path + "/application.properties", 'utf8').replace("driver.name=firefoxDriver", "driver.name=chromeDriver"));
                    callback("done");
                }
            }
        }else{
            callback("not other driver");
        }
    }

    function changeDriverVariableInApplicationProperties(path,driverName,isSave,callback){
        if (driverName === 'firefoxDriver' &&  (fs.existsSync(path)) ) {
            if (checkDirectorySync(path + '/application.properties')) {
                if (isSave) {
                    fs.writeFileSync(path + "/application.properties", fs.readFileSync(path + "/application.properties", 'utf8').replace("system.webdriver.gecko.driver", "webdriver.gecko.driver"));
                    callback("done");
                } else {
                    fs.writeFileSync(path + "/application.properties", fs.readFileSync(path + "/application.properties", 'utf8').replace("webdriver.gecko.driver", "system.webdriver.gecko.driver"));
                    callback("done");
                }
            }
        }else{
            callback("not other driver");
        }
    }

function askForScheduling(path, chrmdriverPath, language, framework, drivername) {
    console.log('');
    inquirer
        .prompt([{
            type: "list",
            name: 'reptiles',
            prefix: '>',
            message: "Do you want to schedule execution ?",
            choices: ['Yes', 'No']
        }])
        .then(answers => {
            var input = answers.reptiles;
            if (input === 'Yes') {
                console.log("Your script will be schedule based on " + Intl.DateTimeFormat().resolvedOptions().timeZone + " timezone .")
                console.log("Your current datetime is " + new Date().toLocaleString());
                scheduleJob = true;
            }
            if (language === 'typescript' || language === 'javascript') {
                executionCommandJavaScritpTypescript(path, framework, language, drivername);
            } else {
                executionCommandJava(path, chrmdriverPath, framework, language, drivername);
            }

        });

}

    function cronExecution(path, chrmdriverPath, language, framework, drivername, cmd) {
        var cronPattern = '';
        inquirer
            .prompt([{
                type: "input",
                prefix: '>',
                name: "Enter HH:MM to schedule script reexecution time (Execution will be repeated by given time period)"
            }])
            .then(answers => {
                cronPattern = answers["Enter HH:MM to schedule script reexecution time (Execution will be repeated by given time period)"];
                if (cronPattern !== undefined && cronPattern !== '' && cronPattern !== null) {
                    // 0 */15 * ? * *
                    var sHours = cronPattern.split(':')[0];
                    var sMinutes = cronPattern.split(':')[1];
    
                    // 0 */15 */4 ? * *
                    if (validateTime(cronPattern)) {
                        if (sMinutes === '00' || sMinutes === '0') {
                            // console.log("zeprrroooo");
                            sMinutes = "*";
                        }
                        if (sHours === '00' || sHours === '0') {
                            // console.log("zeprrr");
                            sHours = "*";
                        }
                        var cronString = "*/" + sMinutes + " " + sHours + " * * *";
                        // var cronString = "0 0/" + sMinutes + " 0/" + sHours;
                        console.log("Execution is scheduled ,wait for next execution");
                        askingEndDateOfSchedular(cronPattern,cronString,path, chrmdriverPath, language, framework, drivername, cmd);
                    } else {
                        cronExecution(path, chrmdriverPath, language, framework, drivername, cmd);
                    }
                }
            });
    
    }


    
function executeCiCdComandJSAndTS(path, framework, language, drivername, cmdJavaScript) {
    if (cmdJavaScript.indexOf('npm') <= -1) {
        exports.isValidCommand=false;
        console.log(cmdJavaScript + ' command not found.');
        revertJSTSModificationOfheadless(framework, language, path, drivername);
        doYouWantToExitWithOptions(path, '', framework, language, drivername);
    } else {
        exports.isValidCommand=true;
        shell.exec(cmdJavaScript, function (code, stdout, stderr) {
            if (stderr) {
                revertJSTSModificationOfheadless(framework, language, path, drivername);
                if (stdout.toString().indexOf('Cucumber HTML report ') >= 1) {
                    printReportPath(framework, path, (returnvalue) => {
                        doYouWantToExitWithOptions(path, '', framework, language, drivername);
                    });
                } else if (stdout.toString().indexOf('Finished in ') >= 1) {
                    printReportPath(framework, path, (returnvalue) => {
                        doYouWantToExitWithOptions(path, '', framework, language, drivername);
                    });
                } else {
                    doYouWantToExitWithOptions(path, '', framework, language, drivername);
                }
            } else {
                revertJSTSModificationOfheadless(framework, language, path, drivername);
                printReportPath(framework, path, (returnvalue) => {
                    doYouWantToExitWithOptions(path, '', framework, language, drivername);
                });
            }
        });
    }
}



function executeCiCdComandJavaAndPython(path, chromePath, framework, language, drivername, cmdJavaScript) {
    if (language === 'java') {
        var commandLineDriver = '';
        if (drivername === 'firefoxDriver') {
            process.env['firefoxDriver'] = 'firefoxDriver';
            commandLineDriver = ' -Dwebdriver.firefox.driver=' + chromePath;
        } else {
            commandLineDriver = ' -Dwebdriver.chrome.driver=' + chromePath;
        }
        var listOFCommands = ["mvn clean test", "mvn test", "mvn site"];
        var result = listOFCommands.findIndex(item => cmdJavaScript.toLowerCase() === item.toLowerCase());
        if (result > -1) {
            exports.isValidCommand=true;
            if (framework === 'junit') {
                if (cmdJavaScript.toLowerCase().indexOf('test') > -1) {
                    // console.log('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -Dwebdriver.chrome.driver=' + chromePath + " site");
                    shell.exec('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -DfailIfNoTests=false ' + commandLineDriver + " test", function (code, stdout, stderr) {
                        if (stderr) {
                            revertModificationOfheadless(framework, language, drivername);
                            if (stderr.toString().indexOf('command not found') <= -1 && stdout.toString().indexOf('Tests run:') > -1) {
                                printReportPath(framework, path, (returnvalue) => {
                                    doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                                });
                            } else {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            }
                        } else {
                            revertModificationOfheadless(framework, language, drivername);
                            if (stdout.toString().indexOf('Tests run:') > -1) {
                                printReportPath(framework, path, (returnvalue) => {
                                    doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                                });
                            } else {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            }
                        }
                    });
                } else if (cmdJavaScript.toLowerCase().indexOf('site') > -1) {
                    // console.log('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -Dwebdriver.chrome.driver=' + chromePath + " site");
                    shell.exec('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -DfailIfNoTests=false ' + commandLineDriver + " site", function (code, stdout, stderr) {
                        if (stderr) {
                            revertModificationOfheadless(framework, language, drivername);
                            if (stderr.toString().indexOf('command not found') <= -1 && stdout.toString().indexOf('Tests run:') > -1) {
                                printReportPath(framework, path, (returnvalue) => {
                                    doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                                });
                            } else {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            }
                        } else {
                            revertModificationOfheadless(framework, language, drivername);
                            if (stdout.toString().indexOf('Tests run:') > -1) {
                                printReportPath(framework, path, (returnvalue) => {
                                    doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                                });
                            } else {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            }
                        }
                    });
                } else {
                    exports.isValidCommand=false;
                    console.log(cmdJavaScript + ' command not found.');
                    revertModificationOfheadless(framework, language, drivername);
                    doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                }
            } else {
                	exports.isValidCommand=true;
                shell.exec(cmdJavaScript + commandLineDriver, function (code, stdout, stderr) {
                    if (stderr) {
                        revertModificationOfheadless(framework, language, drivername);
                        if (stderr.toString().indexOf('command not found') <= -1 && stdout.toString().indexOf('Tests run:') > -1) {
                            printReportPath(framework, path, (returnvalue) => {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            });
                        } else {
                            doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                        }
                    } else {
                        revertModificationOfheadless(framework, language, drivername);
                        if (stdout.toString().indexOf("BUILD SUCCESS") >= 1) {
                            printReportPath(framework, path, (returnvalue) => {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            });
                        } else {
                            doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                        }
                    }
                });
            }

        } else {
            exports.isValidCommand=false;
            console.log(cmdJavaScript + ' is not recognized as an internal or external command, \n operable program or batch file.');
            revertModificationOfheadless(framework, language, drivername);
            doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
        }
    } else {
        // var existingPath = shell.exec("echo $PATH");
        if (drivername === 'firefoxDriver') {
            shell.env["geckodriver"] = chromePath;
        } else {
            shell.env["chromedriver"] = chromePath;
        }
        if (framework === 'robot') {
            var upload = '';
            var isValidPythonCmd = false;
            if (cmdJavaScript.toLowerCase() === "robot --listener python_listener.py --xunit result.xml tests") {
                upload = '--listener python_listener.py --xunit result.xml';
                isValidPythonCmd = true;
            } else if (cmdJavaScript.toLowerCase() === 'robot tests') {
                upload = '';
                isValidPythonCmd = true;
            } else {
                exports.isValidCommand=false;
                console.log(cmdJavaScript + ' command not found.');
                revertModificationOfheadless(framework, language, drivername);
                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
            }
            if (isValidPythonCmd) {
                exports.isValidCommand=true;
                var isweb = false;
                var isMob = false;
                var robotWeburl = path + "/tests/web";
                var robotMobUrl = path + "/tests/mobileweb";
                if (checkDirectorySync(path + "/tests/web")) {
                    isweb = true;

                } else {
                    robotWeburl = '';
                }
                if (checkDirectorySync(path + "/tests/mobileweb")) {
                    isMob = true;
                } else {
                    robotMobUrl = '';
                }
                if (!isMob && !isweb) {
                    console.log('No tests available to run .');
                    doYouWantToExitWithOptions(path, chromePath, framework, language);
                } else {
                    var uris = '';
                    if (robotMobUrl !== '' && robotWeburl !== '') {
                        uris = "robot " + upload + " \"" + robotMobUrl + '\"  \"' + robotWeburl + '\"';
                    }
                    if (robotMobUrl !== '' && robotWeburl == '') {
                        uris = "robot " + upload + " \"" + robotMobUrl + '\"';
                    }
                    if (robotMobUrl === '' && robotWeburl !== '') {
                        uris = "robot " + upload + " \"" + robotWeburl + '\"';
                    }
                    shell.exec(uris, function (code, stdout, stderr) {
                        if (stderr) {
                            revertModificationOfheadless(framework, language, drivername);
                            if ((stdout.toString().indexOf('report.html') >= 1) && (stdout.toString().indexOf('Report:  ' >= 1))) {
                                printReportPath(framework, path, (returnvalue) => {
                                    doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                                });
                            } else {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            }
                        } else {
                            revertModificationOfheadless(framework, language, drivername);
                            printReportPath(framework, path, (returnvalue) => {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            });
                        }
                    });
                }
            }
        } else {
            if (cmdJavaScript.indexOf('behave') <= -1) {
                exports.isValidCommand=false;
                console.log(cmdJavaScript + 'command not found.');
                revertModificationOfheadless(framework, language, drivername);
                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
            } else {
                exports.isValidCommand=true;
                shell.exec(cmdJavaScript, function (code, stdout, stderr) {
                    if (stderr) {
                        revertModificationOfheadless(framework, language, drivername);
                        if (stdout.toString().indexOf('Took ') >= 1) {
                            printReportPath(framework, path, (returnvalue) => {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            });
                        } else {
                            doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                        }
                    } else {
                        revertModificationOfheadless(framework, language, drivername);
                        if (stdout.toString().indexOf('Took 0m0.000s') <= -1) {
                            printReportPath(framework, path, (returnvalue) => {
                                doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                            });
                        } else {
                            doYouWantToExitWithOptions(path, chromePath, framework, language, drivername);
                        }
                    }
                });
            }
        }
    }
}

function is_valid_date(value) {
    // capture all the parts 22-05-2013 11:23:22
    var matches = value.match(/^(\d{4})\-(\d{2})\-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (matches === null) {
        return false;
    } else{
        // now lets check the date sanity
        var year = parseInt(matches[1], 10);
        var month = parseInt(matches[2], 10) - 1; // months are 0-11
        var day = parseInt(matches[3], 10);
        var hour = parseInt(matches[4], 10);
        var minute = parseInt(matches[5], 10);
        var second = parseInt(matches[6], 10);
        var date = new Date(year, month, day, hour, minute, second);
        if (date.getFullYear() !== year
          || date.getMonth() != month
          || date.getDate() !== day
          || date.getHours() !== hour
          || date.getMinutes() !== minute
          || date.getSeconds() !== second
        ) {
           return false;
        } else {

           return true;
        }
    
    }
}

function askingEndDateOfSchedular(hhmmDateString,cronString,path, chrmdriverPath, language, framework, drivername, cmd) {
	// 22-05-2013 11:23:22
	var dateTime;
	inquirer
	.prompt([{
		type: "input",
		prefix: '>',
		name: "Enter end date of scheduling (YYYY-MM-DD HH:MM:SS)?"
	}])
	.then(answers => {
		dateTime = answers["Enter end date of scheduling (YYYY-MM-DD HH:MM:SS)?"];
			if (dateTime !== undefined && dateTime !== '' && dateTime !== null) {
				var today = new Date();
				today.setHours(today.getHours() + parseInt(hhmmDateString.split(":")[0]));
				today.setMinutes(today.getMinutes() + parseInt(hhmmDateString.split(":")[1]));
				if (is_valid_date(dateTime) ) {
					var enterDate = new Date(dateTime);
					// console.log("endDate :: "+enterDate);
					// console.log("1 " +moment(today).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('YYYY-MM-DD HH:mm:ss'));
					// console.log("2 "+moment(moment(enterDate).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('YYYY-MM-DD HH:mm:ss')).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('YYYY-MM-DD HH:mm:ss'));
					if (moment(today).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('YYYY-MM-DD HH:mm:ss') < 
							moment(moment(enterDate).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('YYYY-MM-DD HH:mm:ss')).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('YYYY-MM-DD HH:mm:ss')) {
						var duration = moment.duration(moment(enterDate).diff(new Date()));
						var days = duration.asMilliseconds();
						// console.log("Duration : " + Math.ceil(days));
						exports.miliesecondDuration=Math.ceil(days);
						///
						if (language === 'java' || language === 'python') {
							exports.isFirstRunForSchedule = true;
							executeCiCdComandJavaAndPython(path, chrmdriverPath, framework, language, drivername, cmd);
						} else {
							exports.isFirstRunForSchedule = true;
							executeCiCdComandJSAndTS(path, framework, language, drivername, cmd);
						}
						console.log("Please wait for next execution.");
						if (exports.isValidCommand) {
							const a =new CronJob(cronString, function () {
								exports.isFirstRunForSchedule = false;
								scheduleJob = true;
								if (language === 'java' || language === 'python') {
									if (framework !== 'junit' && language === 'java') {
										loadPropertiesFromEachPath(path, true, drivername, function (response) {
										});
									}
									if (framework === 'robot') {
										changePythonRobotProperties(path, true, drivername);
									}
									if (framework === 'behave') {
										changePythonBehaveProperties(path, true, drivername);
									}
									executeCiCdComandJavaAndPython(path, chrmdriverPath, framework, language, drivername, cmd);
								} else {
									if (framework === 'cucumber') {
										loadPropertiesFromEachPathTSJS(path + "/resources/", true, drivername, function (response) {
										});
										executeCiCdComandJSAndTS(path, framework, language, drivername, cmd);
									}
									if (framework === 'jasmine') {
										var filenameWthLang = "";
										if (language === 'javascript') {
											filenameWthLang = "/env.js";
										} else {
											filenameWthLang = "/env.ts";
										}
										changeJasminProperties(path, true, drivername, filenameWthLang, function (response) {
										});
										executeCiCdComandJSAndTS(path, framework, language, drivername, cmd);
									}
								}
								console.log("Execution is scheduled ,wait for next execution");

							}, null, true, Intl.DateTimeFormat().resolvedOptions().timeZone);
							/* setTimeout(() => { 
								 a.stop();
								console.log('scheduler stopped');
							}, getEnddateMilisecond(response,cronPattern)); */
							setTimeout(() => { schedulerStop(a) }, exports.miliesecondDuration);
						}
					} else {
						console.log("Enddate should be greater then current schedule date");
						askingEndDateOfSchedular(hhmmDateString,cronString,path, chrmdriverPath, language, framework, drivername, cmd);
					}
				} else {
					console.log("Enter valid datetime.");
					askingEndDateOfSchedular(hhmmDateString,cronString,path, chrmdriverPath, language, framework, drivername, cmd);
				}
			} //check
			else {
				console.log("Enter valid datetime.");
				askingEndDateOfSchedular(hhmmDateString,cronString,path, chrmdriverPath, language, framework, drivername, cmd);
			}
		});
}
let schedulerStop = (a) => {
    a.stop();
	console.log('Your scheduler stopped as per your enddate.');
	doYouWantToExit();
}
