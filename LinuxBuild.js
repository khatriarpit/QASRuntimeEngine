var path = require('path');
var PropertiesReader = require('properties-reader');
var shell = require('shelljs');
var process = require('process');
var fs = require('fs');
const exec = require('child_process').exec;
var chromedriverpath;
var pathObject = require("path");
var CronJob = require('cron').CronJob;
var inquirer = require('inquirer');
var inputProjectMode;
var os = require('os');
var response = {};

inquirer
    .prompt([{
        type: "list",
        name: 'reptiles',
        prefix: '>',
        message: "Choose Project to run on QAS Runtime Engine.",
        choices: ['local System', 'Version control', 'Quit'],
    }])
    .then(answers => {
        inputProjectMode = answers.reptiles;
        testings();
    });

function testings() {
    console.log('');
    getInstalledToolsInformation();
    process.env['qasHeadlessMode'] = 'true';
    if (inputProjectMode === 'local System') {
        checkoutFromLocalRepository();
    } else if (inputProjectMode === 'Version control') {
        gitCheckout();
    } else if (inputProjectMode === 'Quit') {
        console.log("Thanks for using QAS Runtime Engine .. ");
        return;
    } else {
        console.log('Wrong Selection, Please select again');
    }
}

function gitCheckout() {
    var path;
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git');
        shell.exit(1);
    }
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
                    console.log("Example : git clone RepositoryURL");
                    processGitClone(path);
                } else {
                    console.log('QAS Runtime Engine can\'t find the path specified.');
                    console.log('');
                    gitCheckout();
                }
            }//check
            else {
                gitCheckout();
            }
        });
}

function processGitClone(path) {
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter Git Clone Command"
        }])
        .then(answers => {
            var cmdPerform = '';
            cmdPerform = answers["Enter Git Clone Command"];
            if (cmdPerform !== undefined && cmdPerform !== '' && cmdPerform !== null) {
                gitCheckoutWithInquer(cmdPerform, path);
            } else {
                processGitClone(path);
            }
        });
}

function gitCheckoutWithInquer(cmdPerform, path) {
    var name = pathObject.parse(cmdPerform).name;
    exports.projectPath = path + "/" + name;
    // exports.projectPath = path;
    process.chdir(path);
    console.log(cmdPerform);
    const a = exec(cmdPerform, function (err, stdout, stderr) {
        if (err) {
            console.log(err);
            processGitClone(path);
        } else {
            console.log("Clone Repository successfully ..");
            // process.chdir(exports.projectPath);
            var projectDetailsFile = exports.projectPath + '/.qas-data/.project';
            if (checkDirectorySync(projectDetailsFile)) {
                shell.exec("chown -R $USER "+exports.projectPath);
                var oldProjectConfiguration = JSON.parse(fs.readFileSync(projectDetailsFile, "utf-8"));
                var oldProjectData = oldProjectConfiguration.projectTypes;
                var language = oldProjectConfiguration.language;
                var framework = oldProjectConfiguration.framework;
                console.log("QAS Runtime Engine works only for Web and Mobile Web frameworks.");
                console.log('');
                if (language !== undefined && language !== '' && language === 'java') {
                    // if (setDriver()) {
                     if (response['mvn'] === null || response['mvn'] === '' || response['mvn'] =='undefined') {
                        shell.echo('QAS Runtime Engine requires Maven for Execution . Please install Apache Maven first .');
                        shell.exit(1);
                    }
                    if (response['java'] === null || response['java'] === '' ||  response['java'] === 'undefined') {
                        shell.echo('QAS Runtime Engine requires Java for Execution . Please install Java.');
                        shell.exit(1);
                    }
                    if (framework !== 'junit') {
                        loadPropertiesFromEachPath(exports.projectPath + "/resources/", true);
                    }
                    if (framework === 'junit') {
                        console.log("Please refer readme.md file in QAS for headless execution .");
                        doJavaScriptExecution(exports.projectPath, framework, language);
                    }else{
                        if(checkExistingPlatform(exports.projectPath)){
                            loadPropertiesFromEachPath(exports.projectPath + "/resources/", true);
                            doJavaScriptExecution(exports.projectPath, framework, language);
                        }else{
                            console.log("Project platform is not supported by QAS Runtime");
                        }
                    }
                   
                }
                else if (language !== undefined && language !== '' && language === 'python') {
                    if ((response['python'] === null || response['python'] === '' || response['python'] === 'undefined') &&
                    (response['python3'] === null || response['python3'] === '' || response['python3'] === 'undefined')) {
                        shell.echo('QAS Runtime Engine requires python for Execution . Please install Python first .');
                        shell.exit(1);
                     }     
                    if ((response['pip'] === null || response['pip'] === '' || response['pip'] === 'undefined') &&
                    (response['pip3'] === null || response['pip3'] === '' || response['pip3'] === 'undefined')) {
                        shell.echo('QAS Runtime Engine requires pip for python Execution . Please install pip first .');
                        shell.exit(1);
                    }
                    if (framework === 'robot') {
                        // checkPythonInstalled(exports.projectPath);
                        changePythonRobotProperties(exports.projectPath, true);
                        executePythonExtraCommand(exports.projectPath,framework,language);
                        // doJavaScriptExecution(exports.projectPath, framework, language);
                    } else {
                        if(checkExistingPlatform(exports.projectPath)){
                            changePythonBehaveProperties(exports.projectPath, true);
                            executePythonExtraCommand(exports.projectPath,framework,language);
                            // doJavaScriptExecution(exports.projectPath, framework, language);
                            }else{
                                console.log("Project platform is not supported by QAS Runtime");
                            }
                    }
                }else if (language !== undefined && language !== '' && language === 'javascript') {
                if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                        shell.echo('QAS Runtime Engine requires npm for Execution . Please install npm first .');
                        shell.exit(1);
                    }
                    if(checkExistingPlatform(exports.projectPath)){
                    if (framework === 'cucumber') {
                        loadPropertiesFromEachPathTSJS(exports.projectPath + "/resources/", true);
                        executeExtraCommand(exports.projectPath, framework, language);
                    }else {
                        changeJasminProperties(exports.projectPath, true);
                        executeExtraCommand(exports.projectPath, framework, language);
                    }
                }else{
                    console.log("Project platform is not supported by QAS Runtime");
                }
                }else if (language !== undefined && language !== '' && language === 'typescript') {
                if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                        shell.echo('QAS Runtime Engine requires npm for Execution . Please install npm first .');
                        shell.exit(1);
                    }
                    if(checkExistingPlatform(exports.projectPath)){
                    if (framework === 'cucumber') {
                        loadPropertiesFromEachPathTSJS(exports.projectPath + "/resources/", true);
                        executeExtraCommand(exports.projectPath, framework, language);
                    }else {
                        changeJasminTypeScriptProperties(exports.projectPath, true);
                        executeExtraCommand(exports.projectPath, framework, language);
                    }
                }else{
                    console.log("Project platform is not supported by QAS Runtime");
                }
                }else {
                    console.log("Invalid QAS Project in given path.");
                    gitCheckout();
                }
            } else {
                console.log("It is not valid QAS Project")
            }
        }
    });
}

function checkoutFromLocalRepository() {
    var path = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter Project Path"
        }])
        .then(answers => {
            path = answers["Enter Project Path"];
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
                    console.log("QAS Runtime Engine works only for Web and Mobile Web frameworks.");
                    console.log('');
                    if (language !== undefined && language !== '' && language === 'java') {
                        // if (setDriver()) {
                            if (response['mvn'] === null || response['mvn'] === '' || response['mvn'] =='undefined') {
                            shell.echo('QAS Runtime Engine requires Maven for Execution . Please install Apache Maven first');
                            shell.exit(1);
                        }
                        if (response['java'] === null || response['java'] === '' ||  response['java'] === 'undefined') {
                            shell.echo('QAS Runtime Engine requires Java for Execution . Please install Java.');
                            shell.exit(1);
                        }
                        if (framework !== 'junit') {
                            loadPropertiesFromEachPath(path + "/resources/", true);
                        }
                        if (framework === 'junit') {
                            console.log("Please refer readme.md file in QAS for headless execution .");
                            doJavaScriptExecution(path, framework, language);
                        }else{
                            if(checkExistingPlatform(path)){
                                loadPropertiesFromEachPath(path + "/resources/", true);
                                doJavaScriptExecution(path, framework, language);
                            }else{
                                console.log("Project platform is not supported by QAS Runtime");
                            }
                        }
                    }
                    else if (language !== undefined && language !== '' && language === 'python') {
                        if ((response['python'] === null || response['python'] === '' || response['python'] === 'undefined') &&
                              (response['python3'] === null || response['python3'] === '' || response['python3'] === 'undefined')) {
                            shell.echo('QAS Runtime Engine requires python for Execution . Please install Python first .');
                            shell.exit(1);
                        }
                        if ((response['pip'] === null || response['pip'] === '' || response['pip'] === 'undefined') &&
                         (response['pip3'] === null || response['pip3'] === '' || response['pip3'] === 'undefined')) {
                            shell.echo('QAS Runtime Engine requires pip for python Execution . Please install pip first .');
                            shell.exit(1);
                        }
                        if (framework === 'robot') {
                            changePythonRobotProperties(path, true);
                            executePythonExtraCommand(path,framework,language);
                            // doJavaScriptExecution(path, framework, language);
                        } else {
                            if(checkExistingPlatform(path)){
                                changePythonBehaveProperties(path, true);
                                executePythonExtraCommand(path,framework,language);
                            //    doJavaScriptExecution(path, framework, language);
                           }else{
                               console.log("Project platform is not supported by QAS Runtime");
                           }
                        }
                    }
                    else if (language !== undefined && language !== '' && language === 'javascript') {
                        if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                            shell.echo('QAS Runtime Engine requires npm for Execution . Please install npm first .');
                            shell.exit(1);
                        }
                        if(checkExistingPlatform(path)){
                        if (framework === 'cucumber') {
                            loadPropertiesFromEachPathTSJS(path + "/resources/", true);
                            executeExtraCommand(path, framework, language);
                        }
                        else {
                            changeJasminProperties(path, true);
                            executeExtraCommand(exports.projectPath, framework, language);
                        }
                    }else{
                        console.log("Project platform is not supported by QAS Runtime");
                    }
                    }
                    else if (language !== undefined && language !== '' && language === 'typescript') {
                        if (response['npm'] === null || response['npm'] === '' || response['npm'] === 'undefined') {
                            shell.echo('QAS Runtime Engine requires npm for Execution . Please install npm first .');
                            shell.exit(1);
                        }
                        if(checkExistingPlatform(path)){
                        if (framework === 'cucumber') {
                            loadPropertiesFromEachPathTSJS(path + "/resources/", true);
                            executeExtraCommand(path, framework, language);
                        }
                        else {
                            changeJasminTypeScriptProperties(path, true);
                            executeExtraCommand(exports.projectPath, framework, language);
                        }
                    }else{
                        console.log("Project platform is not supported by QAS Runtime");
                    }
                    }
                    else {
                        console.log("It is not valid  QAS Project");
                        checkoutFromLocalRepository();
                    }
                } else {
                    console.log("QAS Runtime Engine can\'t find the path specified.");
                    checkoutFromLocalRepository();
                }
            }//if check
            else {
                checkoutFromLocalRepository();
            }
        });
    return;
}
function doJavaScriptExecution(path, framework, language) {
    // shell.env["PATH"] = '';
    // if (!shell.which('mvn')) {
    //     shell.echo('Sorry, this script requires mvn');
    //     shell.exit(1);
    // }
    process.chdir(path);
    var chromePath = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter ChromeDriver path"
        }])
        .then(answers => {
            chromePath = answers["Enter ChromeDriver path"];
            if (chromePath !== null && chromePath !== undefined && chromePath !== '') {
		 /*   const a = shell.exec(chromePath.trim()+' -version', function (err, stdout, stderr) {
                console.log('Index :::::'+stdout.toString().indexOf('ChromeDriver'));
                if(stdout.toString().indexOf('ChromeDriver')==-1){
                    console.log("inside ----------------");
                        console.log('Enter valid chromedriver path.');
                        doJavaScriptExecution(path,framework,language);
                }else{
                    console.log("inside --------------- go for it-");
				executionCommandJava(path,chromePath, framework, language);
			    }
            });*/
            var spawn_9 = require('child_process').spawn(chromePath.trim(), ['-version']);
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
                if(result.toString().indexOf('ChromeDriver')==-1){
                        console.log('Enter valid chromedriver path.');
                        doJavaScriptExecution(path,framework,language);
                }else{
				executionCommandJava(path,chromePath, framework, language);
			    }
            });
         }else {
                doJavaScriptExecution(path, framework, language);
            }
        });
}
function executePythonExtraCommand(path, framework, language) {
    var pipalias='';
    if(!(response['python3'] === null || response['python3'] === '' || response['python3'] === 'undefined')){
        pipalias='3';
    }
    process.chdir(path);
    console.log("Please Wait .Installing required dependencies .");
    shell.exec("pip"+pipalias +" install -r requirements.txt");
    if(framework === 'robot'){
        shell.exec("pip"+pipalias +" install robotframework");
        shell.exec("pip"+pipalias +" install robotframework-appiumlibrary");
    }
    doJavaScriptExecution(path, framework, language);
}
function executeExtraCommand(path, framework, language) {
    var path1 = path;
    process.chdir(path);
    console.log("Please Wait while Installing required dependencies .");
    shell.exec("npm install");
    shell.exec("npm install protractor --save-dev");
    shell.exec("npm install -g tsc");

    if (framework === 'cucumber') {
        shell.exec("npm run webdriver-update"); //cucumber
    }
    if (framework === 'jasmine') {
        shell.exec("npm run prepare"); //jasmine
        if (language == 'typescript') {
            shell.exec("npm run build"); //typeJasmin
        }
    }
    executionCommandJavaScritpTypescript(path1, framework, language);
}
function executionCommandJavaScritpTypescript(path, framework, language) {
    var cmdJavaScript = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter Command for Execution"
        }])
        .then(answers => {
            cmdJavaScript = answers['Enter Command for Execution'];
            if (cmdJavaScript !== null && cmdJavaScript !== undefined && cmdJavaScript !== '') {
                shell.exec(cmdJavaScript , function (err) {
                    if (err) {
                        if(err.toString() === '1'){
                            printReportPath(framework,path);
                        }
                        revertJSTSModificationOfheadless(framework ,language,path);
                    }else{
                        printReportPath(framework,path);
                        revertJSTSModificationOfheadless(framework,language,path);
                    }
                });
                
            } else {
                executionCommandJavaScritpTypescript(path,framework,language);
            }
        });
}

function revertJSTSModificationOfheadless(framework,language,path){
    if (framework === "cucumber" && (language ==='typescript' || language ==='javascript')) {
        loadPropertiesFromEachPathTSJS(path + "/resources/", false);
    }
    if (framework === "jasmine" && language === 'javascript') {
        changeJasminProperties(path, false);
    }
    if (framework === "jasmine" && language === 'typescript') {
        changeJasminTypeScriptProperties(path, false);
    }
}
function executionCommandJava(path,chromePath, framework, language) {
    var cmdJavaScript = '';
    inquirer
        .prompt([{
            type: "input",
            prefix: '>',
            name: "Enter Command for Execution"
        }])
        .then(answers => {
            cmdJavaScript = answers['Enter Command for Execution'];
            if (cmdJavaScript !== null && cmdJavaScript !== undefined && cmdJavaScript !== '') {
                var existingPath = shell.exec("echo $PATH");
                shell.env["PATH"] = existingPath + ':' + chromePath;
                // shell.exec(cmdJavaScript);
                if(language==='java'){
                    if(framework==='junit'){
                        if(cmdJavaScript.toLowerCase().indexOf('test') > -1){
                                        // console.log('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -Dwebdriver.chrome.driver=' + chromePath + " site");
                        shell.exec('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -DfailIfNoTests=false -Dwebdriver.chrome.driver=' + chromePath + " test", function (err) {
                            if (err) {
                                revertModificationOfheadless(framework ,language);
                                if(err.toString() === '1'){
                                    printReportPath(framework,path);
                                }
                            }else{
                                // askForScheduing(cmdJavaScript,chromePath,language,framework);
                                printReportPath(framework,path);
                                revertModificationOfheadless(framework,language);
                            }
                        });
                        }else if(cmdJavaScript.toLowerCase().indexOf('site') > -1) {
                                        // console.log('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -Dwebdriver.chrome.driver=' + chromePath + " site");
                        shell.exec('mvn  -Dtest=tests.web.*.*Test,tests.mobileweb.*.*Test -DfailIfNoTests=false -Dwebdriver.chrome.driver=' + chromePath + " site", function (err) {
                            if (err) {
                                revertModificationOfheadless(framework ,language);
                                if(err.toString() === '1'){
                                    printReportPath(framework,path);
                                }
                            }else{
                                // askForScheduing(cmdJavaScript,chromePath,language,framework);
                                printReportPath(framework,path);
                                revertModificationOfheadless(framework,language);
                            }
                        });
                        }else{
                            console.log('Sorry ,Command not found');
                            shell.exit(1);
                        }
                    
                    }else{
                            shell.exec(cmdJavaScript + ' -Dwebdriver.chrome.driver=' +chromePath, function (err) {
                                if (err) {
                                    revertModificationOfheadless(framework,language);
                                    if(err.toString() === '1'){
                                        printReportPath(framework,path);
                                    }
                                }else{
                                    printReportPath(framework,path);
                                    revertModificationOfheadless(framework,language);
                                }
                            });
                         }
            }else{
                if(framework==='robot'){
                    var isweb=false;
                    var isMob=false;
                    var robotWeburl=path+"/tests/web";
                    var robotMobUrl=path+"/tests/mobileweb";
                    if (checkDirectorySync(path+"/tests/web")) {
                            isweb=true;
                            
                    }else{
                        robotWeburl='';
                    }
                    if (checkDirectorySync(path+"/tests/mobileweb")) {
                        isMob=true;
                    }else{
                        robotMobUrl='';
                    }
                    if(!isMob && !isweb){
                        console.log('No tests available to run .');
                    }else{
                 
                        shell.exec("robot "+robotWeburl+' '+robotMobUrl , function (err) {
                            if (err) {
                                revertModificationOfheadless(framework,language);
                                if(err.toString() === '1'){
                                    printReportPath(framework,path);
                                }
                            }else{
                                printReportPath(framework,path);
                                revertModificationOfheadless(framework,language);
                            }
                        });
                    }
                }else{
                        shell.exec(cmdJavaScript , function (err) {
                            if (err) {
                                revertModificationOfheadless(framework,language);
                                if(err.toString() === '1'){
                                    printReportPath(framework,path);
                                }
                            }else{
                                printReportPath(framework,path);
                                revertModificationOfheadless(framework,language);
                            }
                        });
                }
            }
            } else {
                executionCommandJava(path);
            }
        });
}
function revertModificationOfheadless(framework,language){
    if (framework == "robot") {
        changePythonRobotProperties(exports.projectPath, false);
    }
    if (framework == "behave") {
        changePythonBehaveProperties(exports.projectPath, false);
    }
    if (language === 'java' && framework !== "junit") {
        loadPropertiesFromEachPath(exports.projectPath + "/resources/", false);
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
var user_chromedriverpath;
function setDriver(chrmdriver) {
    if (checkDirectorySync(exports.projectPath + '/resources/application.properties')) {
        var properties = PropertiesReader(exports.projectPath + '/resources/application.properties');
        var setChromeDriverToService = function () {
            user_chromedriverpath = properties.get('webdriver.chrome.driver');
            if (user_chromedriverpath !== undefined && user_chromedriverpath !== '') {
                if (fs.existsSync(user_chromedriverpath)) {
                    chromedriverpath = user_chromedriverpath;
                }
                else {
                    console.log("Path provided in webdriver.chrome.driver configuration parameter is not exist and hence inbuilt chromedriver will be used");
                    chromedriverpath = require('chromedriver').path;
                }
            }
            else {
                // chromedriverpath = require('chromedriver').path;
                properties.set('webdriver.chrome.driver', chrmdriver);
            }
            var chrome = require('selenium-webdriver/chrome');
            // var service = new chrome.ServiceBuilder(chromedriverpath).build();
            // chrome.setDefaultService(service);
            // console.log("Chromedriver path is ::: " + chromedriverpath);
            // console.log("default shell path is ::: " + vscode.workspace.getConfiguration().get('terminal.integrated.shell.windows'));
            // let config = vscode.workspace.getConfiguration("webdriver");
            // var configName = "chrome.driver";
            // var setAsGlobal = config.inspect(configName).workspaceValue === undefined;
            // config.update(configName, chromedriverpath, setAsGlobal);
        };
        var setGeckoDriverToService = function () {
            console.log("setGeckoDriverToService()");
            user_chromedriverpath = properties.get('webdriver.gecko.driver');
            console.log(user_chromedriverpath + "user_chromedriverpath" + user_chromedriverpath !== undefined && user_chromedriverpath !== '');
            if (user_chromedriverpath !== undefined && user_chromedriverpath !== '') {
                if (fs.existsSync(user_chromedriverpath)) {
                    chromedriverpath = user_chromedriverpath;
                }
                else {
                    console.log("Path provided in webdriver.chrome.driver configuration parameter is not exist and hence inbuilt chromedriver will be used");
                    chromedriverpath = require('geckodriver').path;
                }
            }
            else {
                chromedriverpath = require('geckodriver').path;
            }
            chromedriverpath = path.dirname(chromedriverpath);
            // add the geckodriver path to process PATH
            process.env.PATH += path.delimiter + path.join(chromedriverpath, '..');
            // support win32 vs other platforms
            exports.path = process.platform === 'win32' ? path.join(chromedriverpath, '..', 'geckodriver.exe') : path.join(chromedriverpath, '..', 'geckodriver');
            console.log("exports.path:::" + exports.path);
            exports.defaultInstance = require('child_process').execFile(exports.path);
            console.log(" setGeckoDriverToService()");
        };
        setChromeDriverToService();
        // setGeckoDriverToService();
        return true;
    }
    else {
        console.log("Project is Invalid .");
        return false;
    }
}
function changePythonBehaveProperties(path, isSave) {
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
                        if (element !== 'mobileweb') {
                            objectValueMap['chrome.additional.capabilities']={'goog:chromeOptions': {args: ['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu']}};
                        }else{
                            objectValueMap['chrome.additional.capabilities']={"goog:chromeOptions": {"mobileEmulation":{"deviceName":"Pixel 2"},"args": ["--headless", "--disable-gpu","--no-sandbox","--disable-dev-shm-usage"]}};
                        }
                    } else {
                        if (element !== 'mobileweb') {
                             objectValueMap['chrome.additional.capabilities']={ args: [ '--start-maximized' ] };
                        } else {
                            objectValueMap['chrome.additional.capabilities']={"chromeOptions":{"mobileEmulation":{"deviceName":"Pixel 2"}}};
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
            shell.exit(1)
        }
        }
    });
}
function checkPythonInstalled(path) {
    var exec = require('child_process').exec;
    exec('python -c "import platform; print(platform.python_version())"', function (err, stdout, stderr) {
        // console.log(stdout.toString());
        if (stdout.toString() === '') {
            // npm config set python C:\Programs\Python2.7\python2.7.exe
            rl.question("Do you want to set python path (y/n) : ", function (answer) {
                if (answer !== '' && answer.toLowerCase() === 'y') {
                    rl.question("Enter Python installed Path  ", function (path) {
                        if (checkDirectorySync(path)) {
                            shell.exec("npm config set python  " + path);
                        }
                        else {
                            console.log("Directory doesnot Exist");
                            return;
                        }
                    });
                }
            });
        }
    });
}
function changePythonRobotProperties(path, isSave) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/steps/" + element + "/";
        if (fs.existsSync(platformDir)) {
            try{
            if (isSave) {
                if (element === 'mobileweb') {
                    fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("${options}=         Get Chrome Mobile Options", ' ${options}=         Get Chrome Mobile Options \n  Call Method    ${options}    add_argument    --headless \n  Call Method    ${options}    add_argument    --disable-gpu \n  Call Method    ${options}    add_argument    --no-sandbox \n  Call Method    ${options}    add_argument    --disable-dev-shm-usage'));
                } else {
                    fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace(" ${BROWSER}", 'headlesschrome'));
                }
            }
            else {
                if (element === 'mobileweb') {
                    fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("  Call Method    ${options}    add_argument    --headless \n  Call Method    ${options}    add_argument    --disable-gpu \n  Call Method    ${options}    add_argument    --no-sandbox \n  Call Method    ${options}    add_argument    --disable-dev-shm-usage", ''));
                } else {
                    fs.writeFileSync(platformDir + "/step_definitions.robot", fs.readFileSync(platformDir + "/step_definitions.robot", 'utf8').replace("headlesschrome", ' ${BROWSER}'));
                }
            }
        }catch(err){
            if(err.toString().indexOf('EACCES: permission denied') >-1){
                console.log('ERROR: Please give read permission to the project for further execution.' );
            }
            shell.exit(1)
        }
        }
    });
}
function changeJasminProperties(path, isSave) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/resources/" + element + "/";
        try{
        if (fs.existsSync(platformDir)) {
            if (isSave) {
                if (element === 'web') {
                    fs.writeFileSync(platformDir + "/env.js", fs.readFileSync(platformDir + "/env.js", 'utf8').replace("browserName: 'chrome'","browserName: 'chrome',\n chromeOptions: {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}"));
                } else {
                    fs.writeFileSync(platformDir + "/env.js", fs.readFileSync(platformDir + "/env.js", 'utf8').replace("'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}", "'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}"));
                }
            } else {
                if (element === 'web') {
                    fs.writeFileSync(platformDir + "/env.js", fs.readFileSync(platformDir + "/env.js", 'utf8').replace("browserName: 'chrome',\n chromeOptions: {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}","browserName: 'chrome'"));
                } else {
                fs.writeFileSync(platformDir + "/env.js", fs.readFileSync(platformDir + "/env.js", 'utf8').replace( "'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}","'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}"));
                }
            }
        }
    }catch(err){
        if(err.toString().indexOf('EACCES: permission denied') >-1){
            console.log('ERROR: Please give read permission to the project for further execution.' );
        }
        shell.exit(1)
    }
    });
}
function changeJasminTypeScriptProperties(path, isSave) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/resources/" + element + "/";
        if (fs.existsSync(platformDir)) {
            try{
            if (isSave) {
                if (element === 'web') {
                    fs.writeFileSync(platformDir + "/env.ts", fs.readFileSync(platformDir + "/env.ts", 'utf8').replace("browserName: 'chrome'","browserName: 'chrome',\n chromeOptions: {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}"));
                } else {
                fs.writeFileSync(platformDir + "/env.ts", fs.readFileSync(platformDir + "/env.ts", 'utf8').replace("'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}", "'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}"));
                }
            } else {
                if (element === 'web') {
                    fs.writeFileSync(platformDir + "/env.ts", fs.readFileSync(platformDir + "/env.ts", 'utf8').replace("browserName: 'chrome',\n chromeOptions: {\n args: [\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]\n}","browserName: 'chrome'"));
                } else {
                fs.writeFileSync(platformDir + "/env.ts", fs.readFileSync(platformDir + "/env.ts", 'utf8').replace( "'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'},args:[\"--headless\",\"--no-sandbox\",\"--disable-dev-shm-usage\"]}","'chromeOptions':{'mobileEmulation':{'deviceName':'iPhone X'}}"));
                }
                //fs.writeFileSync(platformDir + "/env.ts", fs.readFileSync(platformDir + "/env.ts", 'utf8').replace("--headless", "mode"));
            }
        }catch(err){
            if(err.toString().indexOf('EACCES: permission denied') >-1){
                console.log('ERROR: Please give read permission to the project for further execution.' );
            }
            shell.exit(1)
        }
        }
    });
}
function loadPropertiesFromEachPathTSJS(path, isSave) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/" + element + "/";
        if (fs.existsSync(platformDir)) {
            try{
            fs.readdirSync(platformDir).forEach(function (file) {
                if (file.search("env.properties") !== -1) {
                    var property = new PropertiesReader(platformDir + "env.properties");
                    var objectValueMap = property.getAllProperties();
                    var scaps = objectValueMap['chrome.additional.capabilities'].toString().replace(/\\/g, "");
                    objectValueMap['chrome.additional.capabilities'] = JSON.parse(scaps);
                    if (isSave) {
                        if (Object.keys(objectValueMap['chrome.additional.capabilities']).length === 0) {
                            objectValueMap['chrome.additional.capabilities'] = {
                                chromeOptions: {
                                    args: ['--headless','--no-sandbox','--disable-dev-shm-usage']
                                }
                            };
                        }
                        else {
                            objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'] = ["--headless","--no-sandbox","--disable-dev-shm-usage"];
                        }
                    }
                    else {
                        if (element !== 'mobileweb') {
                            delete objectValueMap['chrome.additional.capabilities'].chromeOptions;
                        } else {
                          delete  objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'] ;
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
            shell.exit(1)
        }
        }
    });
}
function loadPropertiesFromEachPath(path, isSave) {
    var platforms = ['web', 'mobileweb'];
    platforms.forEach(function (element) {
        var platformDir = path + "/" + element + "/";
        if (fs.existsSync(platformDir)) {
             try{
            fs.readdirSync(platformDir).forEach(function (file) {
                if (file.search("env.properties") !== -1) {
                    var property = new PropertiesReader(platformDir + "env.properties");
                    var objectValueMap = property.getAllProperties();
                    var scaps = objectValueMap['chrome.additional.capabilities'].toString().replace(/\\/g, "");
                    objectValueMap['chrome.additional.capabilities'] = JSON.parse(scaps);
                    if (isSave) {
                        if (Object.keys(objectValueMap['chrome.additional.capabilities']).length === 0) {
                            objectValueMap['chrome.additional.capabilities'] = {
                                chromeOptions: {
                                    args: ['--headless','--no-sandbox','--disable-dev-shm-usage']
                                }
                            };
                        }
                        else {
                            objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'] = ["--headless","--no-sandbox","--disable-dev-shm-usage"];
                        }
                    }
                    else {
                        if (element !== 'mobileweb') {
                            delete objectValueMap['chrome.additional.capabilities'].chromeOptions;
                        } else {
                            delete objectValueMap['chrome.additional.capabilities']['chromeOptions']['args'] ;
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
            shell.exit(1)
        }
        }
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

function getInstalledToolsInformation() {
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
                        /* isWin(function (err, version) {
                            // console.log("win: " + version);
                            if (version) {
                                response['windows'] = os.release();
                            }
                            else {
                                response['windows'] = null;
                            }
                            isMac(function (err, version) {
                                // console.log("mac: " + version);
                                if (version) {
                                    response['mac'] = os.release();
                                    response['ios'] = os.release();
                                }
                                else {
                                    response['mac'] = null;
                                    response['ios'] = null;
                                }
                                callback(response);
                            });
                        }); */
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

function askForScheduing(cmd,chrmdriverPath,language,framework){
    inquirer
        .prompt([{
            type: "input",
            name: 'reptiles',
            prefix: '>',
            name: "Do you want to schedule execution?",
            choices: ['Yes', 'No']
        }])
        .then(answers => {
            var input= answers.reptiles;
            if(input=='No'){
                shell.exit(1);
            }else{
                inquirer
                .prompt([{
                    type: "input",
                    prefix: '>',
                    name: "Enter Cron Pattern "
                }])
                .then(answers => {
                    var cronPattern = '';
                    cronPattern = answers["Enter Cron Pattern "];
                    if (cronPattern !== undefined && cronPattern !== '' && cronPattern !== null) {
                        new CronJob(cronPattern, function() {
                        }, null, true, 'America/Los_Angeles');
                        // shell.exec(cmdJavaScript + ' -Dwebdriver.chrome.driver=' + chromePath, function (err) {
                        //  if (err) {
                        //      revertModificationOfheadless(framework ,language);
                        //  }else{
                        //      askForScheduing(cmdJavaScript,chromePath,language,framework);
                        //      revertModificationOfheadless(framework,language);
                        //  }
                    }
                });

            }
        });

    }

function printReportPath(framework,projectPath){
    console.log("----------------------------------------------------------------------------------------------");
    console.log(" Report Path ")
    console.log("----------------------------------------------------------------------------------------------");
  
      if (framework !== 'robot') {
            fs.readFile(projectPath+'/test-results/meta-info.json', (err, data) => {
                if (err) throw err;
                let student = JSON.parse(data);
                var lastValue = student['reports'];
              
                if (lastValue !== undefined) {
                    var lastDirName = lastValue[0].dir;
                    if (lastDirName !== undefined) {
                        console.log(projectPath+"/"+ lastDirName.replace('/json', ''));
                        console.log("----------------------------------------------------------------------------------------------");
                    }
                }
            });
        } else {
            console.log(projectPath + "/report.html");
            console.log("----------------------------------------------------------------------------------------------");
        }
    }