// Initializing global variables
// #region GLOBAL VARIABLES

const FIRST_SEASON = 32;
const LAST_SEASON = 39;

const keyMap = {
  ArrowLeft: () => moveLeft(),
  ArrowRight: () => moveRight(),
  ArrowDown: () => moveDown(),
  ArrowUp: () => moveUp(),
  Space: () => spacebarHandler(),
  KeyA: () => mainBuzz(65),
  KeyB: () => mainBuzz(66),
  KeyX: () => mainBuzz(88),
  KeyY: () => mainBuzz(89),
  KeyL: () => mainBuzz(76),
  KeyR: () => mainBuzz(82)
};

document.addEventListener("keydown", (e) => {
  const handler = keyMap[e.code];
  if (handler) {
    e.preventDefault();
    handler();
  }
});

var gameData = {};
var stateData = {};
var isRandom = 0; // 0 for normal load, 1 for random game load
var gameState = 0; // 0 -- single jeopardy, 1 -- double jeopardy, 2 -- final jeopardy
var clueState = 0; // 0 -- on grid, 1 -- on clue screen, 2 -- on answer screen, 5 -- splash screen
var jsonIndex = 0;
var playerArray = [65,66,88,89,76,82];
var scoreArray = [0,0,0,0,0,0]
var buzzArray = [,,,,,,];
var mainButton = document.getElementById('mainButton');
var duration = 0;
var buzzEnabled = false;

var buzzAudio = new Audio("https://github.com/DrewKeefer/jeoparty.v2/blob/main/audio/buzz.mp3?raw=true");
var earlyAudio = new Audio("https://github.com/DrewKeefer/jeoparty.v2/blob/main/audio/early.mp3?raw=true");
var memeAudio = new Audio("https://github.com/DrewKeefer/jeoparty.v2/blob/main/audio/notyet3.mp3?raw=true");


// #endregion

// #region SPLASH SCREEN

// INTRO SPLASH SCREEN FUNCTIONS

async function randomGame(){
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

function loadButtonHandler(){
  if (isRandom === 1){
    loadGame();
  }
  else {
    displaySeasons();
  }
}

function displaySeasons(){
  // Move game select screen to front
  document.getElementById('loadGamesScreen').style.zIndex = 1;
  // Create list of seasons
  for (let i = FIRST_SEASON; i <= LAST_SEASON; i++){
      let x = document.createElement("button");
      x.id = `season${i}`;
      x.classList = "season-entry";
      x.onclick = (e) =>{
        let selectedSeason = document.querySelector('.selected');
        if (selectedSeason != null){
            selectedSeason.classList.toggle('selected');
        };
        document.getElementById(`season${i}`).classList.toggle('selected');
        displayGames(i);
      };
      let t = document.createTextNode(`Season ${i}`);
      x.appendChild(t);
      document.getElementById("season-list").appendChild(x);
  };
};

async function displayGames(season){
  selectedSeason = await getJSON(`games/season${season}.json`);
  document.getElementById('game-list').textContent = '';
  for (let i = selectedSeason.length; i >= 0; i--){
      if (selectedSeason[i] == null){
          continue;
      }

      // create info container div and add it to game-container
      let gameInfo = document.createElement("div");
      gameInfo.classList = "game-info-container";
      gameInfo.onclick = (e) =>{
        gameData = selectedSeason[i]; // sets the main gameData variable
        document.getElementById('loadGamesScreen').style.display = "none";
        loadGame();
      };
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
}

function toggleBuzz() {
    var checkBox = document.getElementById("buzzToggler");
    var text = document.getElementById("custom-names");
    if (checkBox.checked == true){
      text.style.display = "grid";
      buzzEnabled = true;
    } else {
       text.style.display = "none";
       buzzEnabled = false;
    };
}

// #end region

// #region LOAD FUNCTIONS

function loadGame() {
  if (buzzEnabled === false && gameState === 0){
    document.getElementById('time-bar').remove();
    document.getElementById('buzz-container').remove();
  }
  else if (gameState === 0) { // LOAD PLAYER NAMES
    let nameList = document.getElementsByClassName('custom-input');
    let iconList = document.getElementById('buzz-container').children;
    let scoreListNames = document.getElementsByClassName('score-name');
    let scoreRows = document.getElementById('score-container').children;
    for (i = 0; i < nameList.length; i++){
        iconList[i].innerHTML = nameList[i].value;
        scoreListNames[i].innerHTML = nameList[i].value;
        if(nameList[i].value === ""){
            iconList[i].innerHTML = '???';
            scoreRows[i].style.visibility = 'hidden';
        };
    };
  };
  if (gameState === 0){ // SINGLE JEOPARDY
    stateData.categories = gameData.categories.slice(0,6);
    stateData.clues = gameData.clues.slice(0,30);
  }
  else if (gameState === 1){ // DOUBLE JEOPARDY
    stateData.categories = gameData.categories.slice(6,13);
    stateData.clues = gameData.clues.slice(30,61);
  };
  setCategories(stateData); // sets categories based on stateData
  let allQuestions = document.getElementsByClassName('question'); // adds displayQuestion click events to grid items
  for (let i = 0; i < allQuestions.length; i++) {
      allQuestions[i].onclick = (e) => {
          displayQuestion(i);
    };
  };
  document.getElementById('introSplash').style.display = "none"; // hide splash screen
}

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
}

// Double Jeopardy
function engageDouble(){
  // Show splash screen and change message
  document.getElementById('gameSplash').style.display ='flex';
  document.getElementById('gameSplashMessage').textContent = 'DOUBLE';
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

  // Progress gameState and reload
  gameState = 1;
  clueState = 5;
  loadGame();
}

// FINAL JEOPARDY
function engageFinal(){
  gameState = 2;
  clueState = 5;
  stateData.categories = gameData.categories.slice(-1);
  stateData.clues = gameData.clues.slice(-1);
  jsonIndex = 0;
  // Show splash screen and change message
  document.getElementById('gameSplash').style.display ='flex';
  document.getElementById('gameSplashMessage').textContent = 'FINAL';
  // Progress gameState and display category
  mainButton.innerHTML = 'QUESTION';
  document.getElementById('clueScreen').style.display ='grid';
  document.getElementById('clueClue').textContent = stateData.categories[0].name;

}

// #endregion

// #region GAME NAIGATION

function displayQuestion(index){

  // update grid
  document.getElementsByClassName('question')[index].classList.add('activated'); // hide selected question from board
  document.getElementsByClassName('question')[index].textContent ='';
  document.getElementById('clueScreen').style.display ='grid';

  // display question
  jsonIndex = (index % 5) * 6 + Math.floor(index/5);  // update jsonIndex to be from selected question
  if (gameState === 2){
    jsonIndex = 0;
  }
  else if (gameState === 3){
    window.location.reload(); 
    return;
  };
  document.getElementById('clueClue').textContent = stateData.clues[jsonIndex].clue;
  resizeFont(); // update font size
  clueState = 1; // viewing question clue

  // CHANGE BUTTON
  mainButton.textContent = 'ANSWER';

  // Buzzer
  buzzerHandler();

}

function displayAnswer(jsonIndex){
  buzzerHandler(true);
  mainButton.textContent = 'BACK';
  document.getElementById('clueClue').textContent = stateData.clues[jsonIndex].answer;
  clueState = 2; // 2 -- viewing question answer

  if (buzzEnabled == true){
    // change buzzed color to white
    let playerElements = document.getElementById('buzz-container').children;
    for (i = 0; i < playerElements.length; i++){
        playerElements[i].style.color = 'white';
    };

    document.getElementById('score-container').style.display = 'grid';
  }

}

function mainButtonHandler(){
  if (clueState === 1){ // viewing clue
    displayAnswer(jsonIndex);
  }
  else if (clueState === 0 && gameState === 2){
    displayQuestion(jsonIndex);
  }
  else if (clueState === 2){ // viewing answer
    // CHECK IF GAME IS OVER
    if (gameState === 2){
      endGame();
    }

    // RETURN TO BOARD
    resetBuzzer();
    clueState = 0;
    document.getElementById('clueScreen').style.display ='none';
    document.getElementById('score-container').style.display = 'none';

    // Check if all questions have been activated
    if(document.getElementsByClassName('activated').length == 30){

      // GO TO DOUBLE JEOPARDY
      if(gameState == 0){
        engageDouble();
      }
      // GO TO FINAL JEOPARDY
      else if (gameState == 1){
        engageFinal();
      };
    }
  }
}

function splashButtonHandler(){
  if (gameState === 3){
    window.location.reload(); 
    return;
  };
  document.getElementById('gameSplash').style.display ='none';
  clueState = 0;
}

function endGame(){
  gameState = 3;
  document.getElementById('gameSplash').style.display ='flex';
  document.getElementById('gameSplashMessage').textContent = 'THANKS FOR PLAYING';
  document.getElementById('gameSplashButton').textContent = 'PLAY AGAIN';  
}

// #endregion

// #region BUZZER

/**
 * Self-adjusting interval to account for drifting
 * 
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds)
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 * @param {int}      duration  Timer stops once tickerCount reaches
 * 
 */
function AdjustingInterval(workFunc, interval, errorFunc, duration) {
  var that = this;
  var expected, timeout;
  this.interval = interval;

  this.start = function() {
    expected = Date.now() + this.interval;
    timeout = setTimeout(step, this.interval);
  }

  this.stop = function() {
    clearTimeout(timeout);
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
    if (tickerCount / 50 >= duration - .01 ){
      mainButton.classList.add('main-button-active');
    }
  }
}

var ticker = new AdjustingInterval(doWork, 100, doError, 0);
var tickerCount = 0;

// Define the work to be done
var doWork = function() {
    ++tickerCount;
};

// Define what to do if something goes wrong
var doError = function() {
    console.warn('The drift exceeded the interval.');
};

function buzzerHandler(boolFlag){
  if (boolFlag === true){ // force stops ticker
    mainButton.classList.remove('main-button-active');
    ticker.stop();
    tickerCount = 0;
    return;
  };
  if (buzzEnabled === false){
    return;
  };
  // BUZZER TIMING

  // get duration based on amount of words in clue
  let charNumber = ((stateData.clues[jsonIndex].clue).toString()).length;
  duration = Math.min( (60 * charNumber / 850), 10);
  document.getElementById('time-bar').style.setProperty("--duration", duration);

  ticker = new AdjustingInterval(doWork, 20, doError, duration);
  ticker.start();
}

// Main Buzz Function

function mainBuzz(player){
  if (buzzEnabled === false){
    return;
  };
  if (clueState != 1){ // disable buzzing if not on question screen
    if (clueState = 2){
      calcScore(playerArray.indexOf(player));
      return
    }
    else{
      return;
    }
  };
  let playerIndex = playerArray.indexOf(player);
  if (buzzArray[playerIndex] !== undefined){ // dont let players buzz twice
    return;
  };
  // make player visible when buzzing in
  let activePlayer = document.getElementById('player-'+player);
  activePlayer.style.visibility = 'visible';
  activePlayer.classList.remove('buzz-animate');
  // assign score to buzzArray
  let normalizedTime = tickerCount / 50;
  if (normalizedTime < duration){ // if buzzed in early
    buzzArray[playerIndex] = duration + .5 + (Math.random() / 1000);
    activePlayer.style.color = 'red';
    // meme audio
    if (getRandomInt(0,20) < 1){
      memeAudio.play();
    }
  };
  if (normalizedTime >= duration - .01){ // if buzzed in on time
    buzzArray[playerIndex] = normalizedTime + (Math.random() / 100000); // add random value to prevent ties
  };

  // sort the array
  let sortedArray = buzzArray.slice(); // copies without reference
  sortedArray = sortedArray.sort(function(a, b){return a - b});
  let rankArray = [];
  sortedArray.forEach((element,index) => rankArray[buzzArray.indexOf(element)] = 1 + index);

  let playerElements = document.getElementById('buzz-container').children;
  for (i = 0; i < playerElements.length; i++){
      if (rankArray[i] == undefined){
          playerElements[i].style.gridRow = buzzArray.length;
          continue
      };
      playerElements[i].style.gridRow = rankArray[i];
  };
}

function calcScore(player){
  let clueValue = Math.ceil(jsonIndex / 6 + 0.01) * 200 * (1 + gameState);
  let playerElements = document.getElementById('buzz-container').children;
  let thisPlayerElement = playerElements[player];
  if (thisPlayerElement.style.visibility == 'visible'){
    // if white change to green
    if (thisPlayerElement.style.color == 'white'){
      thisPlayerElement.style.color = 'green';
      scoreArray[player] += clueValue;
    }
    // if green change to red
    else if (thisPlayerElement.style.color == 'green'){
      thisPlayerElement.style.color = 'red';
      scoreArray[player] -= 2 * clueValue
    }
    // if red, change to green
    else if (thisPlayerElement.style.color == 'red'){
      thisPlayerElement.style.color = 'white';
      scoreArray[player] += clueValue
    }
  };

  let scoreListNames = document.getElementsByClassName('score-value');
  for (i = 0; i < scoreListNames.length; i++){
    scoreListNames[i].innerHTML = scoreArray[i];
  }
}

function resetBuzzer(){
  if (buzzEnabled === false){
    return;
  };
  playerArray = [65,66,88,89,76,82];
  buzzArray = [,,,,];
  buzzOrder = 0;
  buzzAllow = 0;
  let playerElements = document.getElementById('buzz-container').children;
  for (i = 0; i < playerElements.length; i++){
      playerElements[i].style.visibility = 'hidden';
      playerElements[i].classList.add('buzz-animate');
      playerElements[i].style.gridRow = 6;
      playerElements[i].style.color = 'white';
  };
}

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

function moveLeft() {
    position.x-=5;
    if (position.x < 0){
        position.x+=5};
    highlightCell()
};

function moveUp() {
    position.x--;
    if (position.x < 0){
        position.x = 0};
    highlightCell()
};

function moveRight() {
    position.x+=5;
    if (position.x >= questionMap[0].length){
        position.x-=5};
    highlightCell()
};

function moveDown() {
    position.x++;
    if (position.x >= questionMap[0].length){
        position.x = questionMap[0].length - 1};
    highlightCell()
};

function highlightCell() {
    $('.question').removeClass('selected');
    questionMap[position.y][position.x].addClass('selected');
};

function spacebarHandler(){
  if (clueState === 0){ // if on question board
    displayQuestion(position.x);
  }
  else if (clueState === 5){ // if on splash screen
    splashButtonHandler();
  }
  else{
    mainButtonHandler();
  };
}

// #endregion

// #region MISC FUNCTIONS

document.querySelectorAll("button").forEach( function(item) {
  item.addEventListener('focus', function() {
      this.blur();
  })
});

async function getJSON(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
};

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

function resizeFont() {
  let charCount = stateData.clues[jsonIndex].clue.length;
  let clueText = document.getElementById("clueClue");
  if (charCount >= 132) {
    let scaleFactor = 5 * (132/charCount);
    clueText.style.fontSize = scaleFactor + "vmax";
  }
  else {
    clueText.style.fontSize = "5vmax";
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