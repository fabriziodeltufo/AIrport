// VARIABLES

const OPENAI = {
    API_BASE_URL: 'https://api.openai.com/v1',
    GPT_MODEL: 'gpt-3.5-turbo',
    CHAT_ENDPOINT: '/chat/completions',
    IMAGE_ENDPOINT: 'images/generations'
}


const form = document.querySelector('.form');
const travel = document.querySelector('.travel');
const cards = document.querySelector('.cards');
const template = document.querySelector('template');

let travelFormData;
let travelPlan;


// FUNCTIONS

// SET APP STATE : to switch from a section to another
function setAppState(state) {
    document.documentElement.dataset.state = state;
}

// SET FORM PREVENT DEFAULT
form.addEventListener('submit', onFormSubmit);


function onFormSubmit(event) {
    event.preventDefault();
    setTravelFormData();
    createTravel();
}


function setTravelFormData() {
    const data = new FormData(form);
    travelFormData = Object.fromEntries(data.entries());
}



function createTravel() {

    setAppState('loading');

    const prompt = `\
    Organizza un weekend di 3 giorni a ${travelFormData.location}. Siamo in ${travelFormData.season}. Sarò ${travelFormData.company}. 
    Per ogni tappa dammi un titolo spiritoso, una lista di luoghi da visitare con le coordinate e qualche 
    curiosità del luogo. Le tue risposte sono solo in formato JSON come questo esempio:
    
    ###
    
    {
        "stages": [{
            "title": "Titolo della tappa",
            "places": [
                {
                    "name": "Nome luogo 1",
                    "coordinates": ["lng", "lat"]             
                },
                {
                    "name": "Nome luogo 2",
                    "coordinates": ["lng", "lat"]             
                }        
            ],
            "facts": "curiosità sul luogo in breve"
        }]
    }
    
    ###`;

    const travelContentResponse = await makeRequest(OPENAI.CHAT_ENDPOINT, {
        model: OPENAI.GPT_MODEL,
        messages: [{
            role: 'user',
            content: prompt
        }],
        temperature: 0.7
    });

    travelPlan = JSON.parse(travelContentResponse.choices[0].message.content);

    renderTravelContent();
    setAppState('travel');

    const travelImageResponse = await makeRequest(OPENAI.IMAGE_ENDPOINT, {

        prompt: `Un weekend a ${travelFormData.location} in ${travelFormData.season} ${travelFormData.company}`,
        n: 1,
        size: '512x512'
    });

    travelPlan.imageUrl = travelImageResponse.data[0].url;

    travel.querySelector('.travel-image').innerHTML = `<img src="${travelPlan.imageUrl}" alt="foto viaggio"`;
}



function renderTravelContent() {
    renderTravelTitle();
    renderTravelStage();
    
    // renderTravelMap();
}


function renderTravelTitle() {
    travel.querySelector('.travel-name').innerHTML = `il tuo viaggio a <b>${travelFormData.location}</b>`;
    travel.querySelector('.travel-detail').innerHTML = `in <b>${travelFormData.season}</b>, <b>${travelFormData.company}</b>`;
}




function renderTravelStage() {
    travelPlan.stages.forEach(function (stage, index) {
        const card = stageComponent(stage, index);
        cards.appendChild(card);
    });

}



function stageComponent(stage, index) {
    const card = template.content.cloneNode(true).querySelector('.card');
    card.dataset.cardId = index;

    card.querySelector('.card-day').innerText = `Giorno ${index + 1}`;
    card.querySelector('.card-title').innerText = stage.title;

    card.querySelector('.card-content').innerHTML = `\
    
        <p>
            <b>Luoghi:</b>
           ${stage.place.map(function (place) {
        return place.name;
    }).join(', ')}
        </p>
        <p>
            <b>Curiosita':</b>
          ${stage.facts}
        </p> `;

    return card;
}





// PREPARE REQUEST FOR AI
async function makeRequest(endpoint, data) {

    const response = await fetch(OPENAI.API_BASE_URL + endpoint, {

        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        method: 'POST',
        body: JSON.stringify(data)

    });

    const json = await response.json();
    return json;
}













