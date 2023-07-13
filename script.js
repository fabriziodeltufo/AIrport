// VARIABLES

const OPENAI = {
    API_BASE_URL: 'https://api.openai.com/v1',
    GPT_MODEL: 'gpt-3.5-turbo',
    CHAT_ENDPOINT: '/chat/completions',
    IMAGE_ENDPOINT: '/images/generations'
}


const form = document.querySelector('form');
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
    setAppState('loading');

    if (API_KEY != '') {
        createTravel();
    } else {
        alert('YOU HAVE TO REGISTER AN API KEY AND TOM TOM API KEY TO USE THIS WEB APP AND \nINSERT THEM INTO A FILE NAMED config.js\n ie: const API_KEY = "value"; ');
    }
}


function setTravelFormData() {
    const data = new FormData(form);
    travelFormData = Object.fromEntries(data.entries());
}



async function createTravel() {


    const prompt = `\
    Organizza un weekend di 2 giorni a ${travelFormData.location} in ${travelFormData.season}. 
    Per ogni tappa dammi 1 titolo spiritoso, 2 luoghi da visitare con le coordinate e qualche 
    curiosità del luoghi. Le tue risposte sono solo in formato JSON come questo esempio:
    
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
    console.log(travelPlan);

    renderTravelContent();
    setAppState('travel');

    const travelImageResponse = await makeRequest(OPENAI.IMAGE_ENDPOINT, {

        prompt: `Un weekend a ${travelFormData.location} in ${travelFormData.season} `,
        n: 1,
        size: '512x512'
    });

    travelPlan.imageUrl = travelImageResponse.data[0].url;
    console.log(travelPlan.imageUrl);

    travel.querySelector('.travel-image').innerHTML = `<img src="${travelPlan.imageUrl}" alt="foto viaggio">`;
}



function renderTravelContent() {
    renderTravelTitle();
    renderTravelStage();

    renderTravelMap();
}


function renderTravelMap() {
    tomtomMap = tt.map({
        key: TOMTOM_KEY,
        container: 'map'  // div id #map 
    });

    const bounds = new tt.LngLatBounds();
    travelPlan.stages.forEach(function (stage, index) {
        stage.places.forEach(function (place) {
            renderPlaceMarker(place, index);
            bounds.extend(place.coordinates);
        });
    });


    tomtomMap.once('idle', function () {
        tomtomMap.fitBounds(bounds);
    });

}

function renderPlaceMarker(place, index) {

    const marker = document.createElement('div');
    marker.innerHTML = '<img src="images/marker.svg" alt="marker icon"> ';
    marker.dataset.cardId = index;
    marker.addEventListener('mouseenter', onCardMouseEnter);
    marker.addEventListener('mouseleave', onCardMouseLeave);

    const popup = new tt.Popup({ offset: 30 }).setText(place.name);

    new tt.Marker(marker)
        .setLngLat(place.coordinates)
        .setPopup(popup)
        .addTo(tomtomMap);
}


function onCardMouseEnter(event) {
    const cardId = event.currentTarget.dataset.cardId;
    cards.querySelector(`.card[data-card-id="${cardId}"]`).classList.add('hover');
}


function onCardMouseLeave(event) {
    const cardId = event.currentTarget.dataset.cardId;
    cards.querySelector(`.card[data-card-id="${cardId}"]`).classList.remove('hover');
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
           ${stage.places.map(function (place) {
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













