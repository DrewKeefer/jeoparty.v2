
function addClickEventsToGridItems() {
    let allQuestions = document.getElementsByClassName("question");
    for (let i = 0; i < allQuestions.length; i++) {
        allQuestions[i].onclick = (e) => {
            displayQuestion(i);
      };
    }
};
addClickEventsToGridItems();

function displayQuestion(index) {
    console.log(`Question ${index} was clicked`)
};