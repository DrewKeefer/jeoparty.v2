/* HIEARCHY

mainLoad()  -- based on gameState
    - update stateData.categories and stateData.clues
    - setCategories(stateData)
        - 

*/

// Initializing global variables
// #region GLOBAL VARIABLES

var gameData = {};
var stateData = {};
var isRandom = 0; // 0 for normal load, 1 for random game load
var gameState = 0; // 0 -- single jeopardy, 1 -- double jeopardy, 2 -- final jeopardy
var clueState = 0;
var nextButton = document.getElementById('next');
nextButton.addEventListener("click", nextButtonHandler);
var jsonIndex = 0;
var playerArray = [65,66,88,89];
var buzzArray = [,,,,];
var buzzOrder = 0;
var buzzPenalty = 2.5;


// #endregion

// Loading seasons/games/categories & adding event listeners to grid
// #region LOADING ASSETS

// get player names

function loadNames(){
    let nameList = document.getElementsByClassName('custom-input');
    let iconList = document.getElementById('buzz-container').children;
    for (i = 0; i < nameList.length; i++){
        iconList[i].innerHTML = nameList[i].value;
        if(nameList[i].value === ""){
            iconList[i].innerHTML = '???';
        };
    };

    // remove random button and name inputs
    document.getElementById('random-id').remove();
    document.getElementById('game-info-id').remove();
    document.getElementById('custom-names').remove();
};


async function getJSON(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
};

function loadButtonHandler(){
    if (gameState==0){
        if (isRandom==1){
            loadNames();
            mainLoad();
            document.getElementsByClassName('splash')[0].style.zIndex = -10;
            document.getElementsByClassName('splash')[0].style.display = 'none';
            return
        };
        loadGame();
    }
    else {
        document.getElementsByClassName('splash')[0].style.zIndex = -10;
        document.getElementsByClassName('splash')[0].style.display = 'none';
    };
}

async function loadRandomHandler(){
    isRandom = 1;
    seasonRand = getRandomInt(32,40);
    selectedSeason = await getJSON(`games/season${seasonRand}.json`);
    gameRand = getRandomInt(0,selectedSeason.length);
    gameData = selectedSeason[gameRand];
    if (gameData == null){
        console.log('NULL GAME');
    };
    if(document.getElementsByClassName('select-container').length != 0){
        document.getElementsByClassName('select-container')[0].remove();
    };
    document.getElementById('game-info-id').innerHTML = gameData.gameTitle + "<br />" +gameData.gameComments;
}

function loadGame(){
    // Create list of seasons
    for (let i = 1; i < 40; i++){
        let x = document.createElement("button");
        x.id = `season${i}`;
        x.classList = "season-entry";
        let t = document.createTextNode(`Season ${i}`);
        x.appendChild(t);
        document.getElementById("season-list").appendChild(x);
    };
    // set player names
    loadNames();


    addClickEventsToSeasonButtons();
    document.getElementsByClassName('splash')[0].style.display ='none';
};

// Display games for selected season

async function displayGames(i){
    selectedSeason = await getJSON(`games/season${i}.json`);
    document.getElementById('game-list').textContent = '';
    for (let i = 0; i < selectedSeason.length; i++){
        if (selectedSeason[i] == null){
            console.log('NULL SEASON');
            continue;
        }

        // create info container div and add it to game-container
        let gameInfo = document.createElement("div");
        gameInfo.classList = "game-info-container";
        document.getElementById("game-list").appendChild(gameInfo);

        // create game title and comments texts
        let gameTitle = document.createElement("span");
        let titleNode = document.createTextNode(selectedSeason[i].gameTitle);
        gameTitle.appendChild(titleNode);
        let gameComments = document.createElement("span");
        let commentsNode = document.createTextNode(selectedSeason[i].gameComments);
        gameComments.appendChild(commentsNode);

        // add title and comment to info div
        gameInfo.appendChild(gameTitle);
        gameInfo.appendChild(gameComments);
    }
    addClickEventsToGameButtons();
}

// Add click events to game entry buttons

function addClickEventsToGameButtons() {
    let allGames = document.getElementsByClassName('game-info-container');
    for (let i = 0; i < allGames.length; i++) {
        allGames[i].onclick = (e) => {
            gameData = selectedSeason[i]; // sets the main gameData variable
            document.getElementsByClassName('select-container')[0].remove();
            mainLoad();
      };
    }
};

// Add click events to season entry buttons

function addClickEventsToSeasonButtons() {
    let allSeasons = document.getElementsByClassName('season-entry');
    for (let i = 0; i < allSeasons.length; i++) {
        allSeasons[i].onclick = (e) => {
            let selectedSeason = document.querySelector('.selected');
            if (selectedSeason != null){
                selectedSeason.classList.toggle('selected');
            };
            allSeasons[i].classList.toggle('selected');
            displayGames(i+1);
      };
    }
};

// Automatically add click events to all questoins
function addClickEventsToGridItems() {
    let allQuestions = document.getElementsByClassName('question');
    for (let i = 0; i < allQuestions.length; i++) {
        allQuestions[i].onclick = (e) => {
            displayQuestion(i);
      };
    }
};

// Change category names
function setCategories(stateData){
    let allCategories = document.getElementsByClassName('category');
    // Clear previous comments
    if (gameState >= 1){
        let previousComments = document.querySelectorAll("[id='marker-id']");
        if (previousComments.length != 0){
            previousComments.forEach((element) => element.remove());
        };
    };
    for (let i = 0; i < allCategories.length; i++){
        allCategories[i].textContent = stateData.categories[i].name;
        // Add comment element if present
        if (stateData.categories[i].comments != ""){
            // add html code
            let marker = document.createElement("span");
            marker.className = "comment-marker";
            marker.id = "marker-id";
            marker.innerHTML = "?";
            let commentElement = document.createElement("span");
            commentElement.className = "comment";
            commentElement.id = "comment-id";
            commentElement.innerHTML = stateData.categories[i].comments;
            document.getElementsByClassName('category-container')[i].appendChild(marker);
            document.getElementsByClassName('category-container')[i].appendChild(commentElement);
        };
    };
    clueState = 1; // 1 -- on question board
};

// #endregion


// Main update function and progressing through question -> answer -> board
// #region GAME PROGRESSION
function mainLoad(){
    // check which data to load
    if (gameState == 0){ // single Jeopardy
        stateData.categories = gameData.categories.slice(0,6);
        stateData.clues = gameData.clues.slice(0,30);
    }
    else if (gameState == 1){ // double Jeopardy
        stateData.categories = gameData.categories.slice(6,13);
        stateData.clues = gameData.clues.slice(30,61);
        // Display splash screen
        document.getElementsByClassName('splash')[0].style.zIndex =10;
        document.getElementsByClassName('splash')[0].style.display = 'grid';
        document.getElementById('splash-message').textContent = 'DOUBLE';
        let splashButton = document.getElementById('load-id');
        splashButton.textContent = 'GO';
    }
    else{ // final Jeopardy
        clueState = 4;
        gameState++;
        stateData.categories = gameData.categories.slice(-1);
        stateData.clues = gameData.clues.slice(-1);
        // Display splash screen
        document.getElementsByClassName('splash')[0].style.zIndex =10;
        document.getElementsByClassName('splash')[0].style.display = 'grid';
        document.getElementById('splash-message').textContent = 'FINAL';
        let splashButton = document.getElementById('load-id');
        splashButton.textContent = 'LETS GO!';
        // Get rid of buzzer bar
        document.getElementById('time-bar').style.display = 'none';
        // Display the category
        document.getElementsByClassName('clue-screen')[0].style.display ='grid';
        document.getElementsByClassName('clue-clue')[0].textContent = stateData.categories[0].name;
        nextButton.innerHTML = 'QUESTION';
        nextButton.onclick = (e) => {
            displayQuestion(0);
        };

    };
    addClickEventsToGridItems();
    setCategories(stateData);
}

function displayQuestion(index) {
    resetBuzzer(); // reset buzzer in case buzz occured on question screen
    document.getElementsByClassName('question')[index].classList.add('activated'); // hide selected question from board
    document.getElementsByClassName('question')[index].textContent ='';
    document.getElementsByClassName('clue-screen')[0].style.display ='grid';
    jsonIndex = (index % 5) * 6 + Math.floor(index/5);  // update jsonIndex to be from selected question
    document.getElementsByClassName('clue-clue')[0].textContent = stateData.clues[jsonIndex].clue;
    clueState = 2; // 2 -- viewing question clue

    // CHANGE BUTTON
    nextButton.style.color = 'white';
    nextButton.style.border = 'solid .3vmax white';
    nextButton.textContent = 'ANSWER'

    if (gameState == 3){ // Disable buzzer for final jeoparty
        buzzAllow = 1;
        return
    }
    buzzerHandler(); // START BUZZ TIME
}

function displayAnswer(jsonIndex){
    document.getElementsByClassName('clue-clue')[0].innerHTML = stateData.clues[jsonIndex].answer;
    clueState = 3; // 3 -- viewing question answer

    // RESET BUTTON AND BUZZER
    nextButton.style.color = 'white';
    nextButton.style.border = 'solid .3vmax white';
    nextButton.textContent = 'BACK'
    resetBuzzer();
}

function nextButtonHandler(){ // handles button on clue screen and answer screen
    
    // IF ON CLUE SCREEN
    if (clueState === 2){
        nextButton.textContent = 'ANSWER'
        if (buzzAllow === 1){ // DONT DISPLAY ANSWER UNTIL BUZZING IS ALLOWED
            displayAnswer(jsonIndex)
        }
    }
    // IF ON ANSWER SCREEN
    else if (clueState === 3){
        backButtonHander();
    };
}

function backButtonHander(){
    //

    document.getElementsByClassName('clue-screen')[0].style.display ='none';
    // Check if all questions have been activated
    if(document.getElementsByClassName('activated').length == 30){
        if(gameState == 0){
            engageDouble();
        }
        else if(gameState == 1){
            gameState++
            mainLoad();
            return
        }
    }
    else{
        clueState = 1; // returning to question board, so resetting clueState
    };
    // Check if game is over
    if (gameState == 3){ // if game over
        document.getElementsByClassName('splash')[0].style.zIndex =10;
        document.getElementsByClassName('splash')[0].style.display = 'grid';
        document.getElementById('splash-message').textContent = 'THANKS FOR PLAYING';
        let splashButton = document.getElementById('load-id');
        splashButton.textContent = 'PLAY AGAIN';
        splashButton.onclick = (e) => { // reset game
            window.location.reload();
        };
    };
}

function spacebarHandler(){
    if (clueState === 4){ // 4 --- final Jeopardy
        if(document.getElementsByClassName('splash')[0].style.display === 'grid'){ // if on splash screen
            loadButtonHandler();
        }
        else{
            clueState = 2;
            displayQuestion(0);
        };    
    }
    else if (document.getElementsByClassName('splash')[0].style.display === 'grid'){ // remove functionality of spacebar when splash screen is displayed and not final jeopardy
        if(document.getElementById('load-id').innerHTML === 'GO'){
            loadButtonHandler();    // unless splash screen is double jeopardy, then proceed
            return;
        }
        else{
            return
        };
    }
    else if (clueState === 1){ // 1 --- viewing question board
        displayQuestion(position.x);
    }
    else{
        nextButtonHandler();
    };
};


// Double Jeopardy
function engageDouble(){
    // Update Question Values
    let questionValues = ["one","two","three","four","five"];
    questionValues.forEach((item, index) => {
        let newValues = ["$400", "$800", "$1200", "$1600", "$2000"]
        let currentValue = document.querySelectorAll(`div.${item}`);
        currentValue.forEach((element) => {
            element.textContent = newValues[index];
        });
    });
    // Remove activated class from questions
    let activeQuestions = document.querySelectorAll('div.activated');
    activeQuestions.forEach((element) =>{
        element.classList.remove('activated');
    });

    // Progress gameState, prepare clueState, and reload
    gameState = 1;
    mainLoad(gameState);
}

// #endregion 


// #region KEYBOARD NAVIGATION

var position = { x: 0, y:0};
var questionMap = [];

$(document).ready(function () {
    $('.grid-container').each(function () {
        questionMap.push([]);
        $('.question', this).each(function () {
            questionMap[questionMap.length - 1].push($(this));
        });
    });
    highlightCell();
});

$(window).on('keydown', function (e) {

    // GRID NAVIGATION
    if (e.keyCode === 37) {// left
        moveLeft();}
    else if (e.keyCode === 38){ // up
        moveUp();}
    else if (e.keyCode === 39){ // right
        moveRight();}
    else if (e.keyCode === 40){ // down
        moveDown();}
    else if (e.keyCode === 32){ // spacebar handler
        spacebarHandler();}
    else if (e.keyCode === 70){ // F key
        fullScreenToggle();}

    // BUZZING
    else if (e.keyCode === 65){ // a key
        mainBuzz(e.keyCode);}
    else if (e.keyCode === 66){ // b key
        mainBuzz(e.keyCode);}
    else if (e.keyCode === 88){ // x key
        mainBuzz(e.keyCode);}
    else if (e.keyCode === 89){ // y key
        mainBuzz(e.keyCode);};
    highlightCell();
});

function moveLeft() {
    position.x-=5;
    if (position.x < 0){
        position.x+=5};
};

function moveUp() {
    position.x--;
    if (position.x < 0){
        position.x = 0};
};

function moveRight() {
    position.x+=5;
    if (position.x >= questionMap[0].length){
        position.x-=5};
};

function moveDown() {
    position.x++;
    if (position.x >= questionMap[0].length){
        position.x = questionMap[0].length - 1};
};

function highlightCell() {
    $('.question').removeClass('selected');
    questionMap[position.y][position.x].addClass('selected');
};

// #endregion

// #region BUZZING FUNCTIONS

/**
 * Self-adjusting interval to account for drifting
 * 
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds)
 * @param {int}      duration  Time that ticker should run
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 */
function AdjustingInterval(workFunc, interval, duration, errorFunc) {

    var that = this;
    var expected, timeout;
    this.interval = interval;

    this.start = function() {
        expected = Date.now() + this.interval;
        timeout = setTimeout(step, this.interval);
    }

    this.stop = function() {
        clearTimeout(timeout);
        countingNumber = 0;
    }

    function step() {
        var drift = Date.now() - expected;
        if (drift > that.interval) {
            // You could have some default stuff here too...
            if (errorFunc) errorFunc();
        }
        workFunc();
        expected += that.interval;
        timeout = setTimeout(step, Math.max(0, that.interval-drift));
        if ((countingNumber/interval*10) >= duration){
            allowBuzz();
            that.stop();
        }
    }
}

// Initialize starting number and buzz allow
var countingNumber = 0;
var buzzAllow = 0; // 0 when buzzing isn't allowed, 1 when it is

// Define the work to be done
var doWork = function() {
    ++countingNumber;
};

// Define what to do if something goes wrong
var doError = function() {
    console.warn('The drift exceeded the interval.');
};

function buzzerHandler(){
    // BUZZER TIMING

    // get duration based on amount of words in clue

    let charNumber = ((stateData.clues[jsonIndex].clue).toString()).length;
    let buzzerDuration = (60 * charNumber) / 775;
    // buzzerDuration = 1; // testing
    document.getElementById('time-bar').style.setProperty("--duration", buzzerDuration);

    // (The third argument is optional)
    var ticker = new AdjustingInterval(doWork, 100, buzzerDuration, doError);
    ticker.start();
};

// Allow buzzing Function
function allowBuzz(){
    nextButton.style.color = '#FBA537';
    nextButton.style.border = 'solid .3vmax #FBA537';
    buzzAllow = 1;
}

// Main Buzz Function

function mainBuzz(player){
    if (clueState != 2 || gameState === 3){ // disable buzzing if not on question or on final jeopardy
        return;
    }
    let playerIndex = playerArray.indexOf(player);
    if (buzzAllow == 0){ // assign penalty
        if (buzzArray[playerIndex] == undefined){
            buzzArray[playerIndex] = buzzPenalty;
            if (buzzOrder == 0){
                buzzArray[playerIndex] += .1;
            };

            // meme audio
            if (getRandomInt(0,20) < 1){
                let audio = new Audio("./audio/notyet"+getRandomInt(1,4)+".mp3");
                audio.play();
            }
            else{
                let audio = new Audio("./audio/early.mp3")
                audio.play();
            }

            let activePlayer = document.getElementById('player-'+player);
            activePlayer.style.color = 'red';
            buzzArray[playerIndex] += buzzOrder;
            ++buzzOrder;
            sortBuzz(player);
        };
    };
    if (buzzAllow == 1){ // no penalty
        if (buzzArray[playerIndex] == undefined){
            let audio = new Audio("./audio/buzz.mp3");
            audio.play();
            buzzArray[playerIndex] = 0 + buzzOrder;
            ++buzzOrder;
            sortBuzz(player);
        };
    };
}

function sortBuzz(player){
    // make player visible when buzzing in

    let activePlayer = document.getElementById('player-'+player);
    activePlayer.style.visibility = 'visible';
    activePlayer.classList.remove('buzz-animate');

    // find players who have buzzed in

    // BUZZ ARRAY CONDITIONS
    // undefined - not buzzed, no penalty
    // 1.5 - not buzzed, no penalty
    // integer - buzzed, no penalty
    // real number not 1.5 - buzzed, penalty
    // 1.6 - buzzed in first with penalty
    // Only need to sort the last three cases

    let activePlayersArray = [];
    for (i=0; i<buzzArray.length; i++){
        let toPush = 0;
        if (buzzArray[i] > buzzPenalty || Number.isInteger(buzzArray[i]) == true){
            toPush = buzzArray[i];
        }
        else{
            toPush = undefined;
        };
        activePlayersArray.push(toPush);
    };

    let sortedArray = activePlayersArray.toSorted();

    let rankArray = [];
    sortedArray.forEach((element,index) => rankArray[activePlayersArray.indexOf(element)] = 1 + index);

    let playerElements = document.getElementById('buzz-container').children;
    for (i = 0; i < playerElements.length; i++){
        if (rankArray[i] == undefined){
            playerElements[i].style.gridRow = 4;
            continue
        };
        playerElements[i].style.gridRow = rankArray[i];
    };

}

function resetBuzzer(){
    playerArray = [65,66,88,89];
    buzzArray = [,,,,];
    buzzOrder = 0;
    buzzAllow = 0;
    let playerElements = document.getElementById('buzz-container').children;
    for (i = 0; i < playerElements.length; i++){
        playerElements[i].style.visibility = 'hidden';
        playerElements[i].classList.add('buzz-animate');
        playerElements[i].style.gridRow = 4;
        playerElements[i].style.color = 'white';
    };
}

// #endregion

// #region MISC FUNCTIONS

document.querySelectorAll("button").forEach( function(item) {
    item.addEventListener('focus', function() {
        this.blur();
    })
});

function fullScreenToggle(){
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
  }
  
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }

  // #endregion