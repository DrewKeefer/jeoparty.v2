const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

function addClickEventsToGridItems() {
    let allQuestions = document.getElementsByClassName('question');
    for (let i = 0; i < allQuestions.length; i++) {
        allQuestions[i].onclick = (e) => {
            displayQuestion(i);
      };
    }
};
addClickEventsToGridItems();

function displayQuestion(index) {
    console.log(`Question ${index} was clicked`);
};

function loadGame(){
    console.log('Game is loading');



    document.getElementsByClassName('splash')[0].style.display ='none';
}


async function mainLoad(){
    try{
        const { data } = await axios.get('https://j-archive.com/');
        const $ = cheerio.load('')
        console.log($);
    } catch (error) {
        console.log('oh no');
    };
};

mainLoad();