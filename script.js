var gameData = {};
var stateData = {};
var gameState = 0; // 0 -- single jeopardy, 1 -- double jeopardy, 2 -- final jeopardy
var clueState = 0;

function loadButtonHandler(){
    if (gameState==0){
        loadGame();
    }
    else {
        document.getElementsByClassName('splash')[0].style.zIndex = -10;
        document.getElementsByClassName('splash')[0].style.display = 'none';
    }
}

function mainLoad(){
    console.log('loading')
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
        // Display the category
        document.getElementsByClassName('clue-screen')[0].style.display ='grid';
        document.getElementsByClassName('clue-clue')[0].textContent = stateData.categories[0].name;
        let nextButton = document.getElementById('next');
        nextButton.textContent = 'QUESTION';
        nextButton.onclick = (e) => {
            displayQuestion(0);
        };

    };
    addClickEventsToGridItems();
    setCategories(stateData);
};


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
    for (let i = 0; i < allCategories.length; i++){
        allCategories[i].textContent = stateData.categories[i].name;
        // Add comment element if present
        if (stateData.categories[i].comments != ""){
            console.log("adding comment things" )
            // add html code
            let marker = document.createElement("span");
            marker.className = "comment-marker";
            marker.innerHTML = "?";
            let commentElement = document.createElement("span");
            commentElement.className = "comment";
            commentElement.innerHTML = stateData.categories[i].comments;

            document.getElementsByClassName('category-container')[i].appendChild(marker);
            document.getElementsByClassName('category-container')[i].appendChild(commentElement);
        }
    };
    clueState = 1; // 1 -- on question board
};

function displayQuestion(index) {
    document.getElementsByClassName('question')[index].classList.add('activated');
    document.getElementsByClassName('question')[index].textContent ='';
    document.getElementsByClassName('clue-screen')[0].style.display ='grid';
    jsonIndex = (index % 5) * 6 + Math.floor(index/5);
    document.getElementsByClassName('clue-clue')[0].textContent = stateData.clues[jsonIndex].clue;
    clueState = 2; // 2 -- viewing question clue
    let nextButton = document.getElementById('next');
    nextButton.textContent = 'ANSWER';
    nextButton.onclick = (e) => {
        displayAnswer(jsonIndex);
    };
};

function displayAnswer(jsonIndex){
    document.getElementsByClassName('clue-clue')[0].innerHTML = stateData.clues[jsonIndex].answer;
    clueState = 3; // 3 -- viewing question answer
    document.getElementById('next').innerHTML = 'BACK';
    document.getElementById('next').onclick = (e) =>{
        backButtonHander();
    };
}

function backButtonHander(){
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
};

// Load JSON function
async function getJSON(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
};


// Keyboard Navigation

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
        fullScreenToggle();}; 
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
    else if (clueState === 2){ // 2 --- viewing question clue
        displayAnswer(jsonIndex);
    }
    else if (clueState === 3){ // 3 --- viewing question answer
        backButtonHander();
    };
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