const URL = 'http://localhost:8080'

var token = "";

async function kirjaudu() {
    const kirjautuminen  = document.getElementById("kirjautuminen");
    kirjautuminen.hidden = false;

    const lomake = document.createElement('form')

    const kayttis = document.createElement('input')
    kayttis.id = "kayttajainput"
    kayttis.type = "text"
    kayttis.placeholder = "Käyttäjänimi"
    lomake.appendChild(kayttis)

    const salis = document.createElement('input')
    salis.type = "password"
    salis.placeholder = "Salasana"
    lomake.appendChild(salis)

    kirjautuminen.appendChild(lomake)

    const loginButton = document.createElement('button')
    loginButton.id = "login-button"
    loginButton.onclick = function () {
        haeTapahtumat(kayttis.value, salis.value)
        kirjauduUlos()
    }
    loginButton.innerHTML = "Kirjaudu sisään"
    kirjautuminen.appendChild(loginButton)
    
}

kirjaudu()

async function kirjauduUlos() {
    const uloskirjautuminen  = document.getElementById("uloskirjautuminen");
    uloskirjautuminen.hidden = false;

    var logout = document.createElement('a');
    var linkText = document.createTextNode("Kirjaudu ulos");
    logout.appendChild(linkText);
    logout.href = "";
    uloskirjautuminen.appendChild(logout);
}

async function haeTapahtumat(kayttis, salis){
    token = btoa(`${kayttis}:${salis}`);

    const kirjautuminen  = document.getElementById("kirjautuminen");
    kirjautuminen.hidden = true;

    const tapahtumavalikko  = document.getElementById("tapahtumavalikko");
    tapahtumavalikko.hidden = false;

    const select  = document.getElementById("tapahtumat");
    select.hidden = false;
    select.size = 10;

    var headers = new Headers({
        'Authorization': `Basic ${token}`
    });

    const tapahtumatresponse = await fetch(`${URL}/tapahtumat`, { headers: headers } );
    const tapahtumatjson = await tapahtumatresponse.json();

    console.log(tapahtumatjson)
    
    tapahtumatjson.forEach((tapahtuma) => {
        const newTapahtuma = document.createElement('option')
        newTapahtuma.id = tapahtuma.id
        newTapahtuma.value = tapahtuma.nimi
        newTapahtuma.innerHTML = tapahtuma.nimi
        select.appendChild(newTapahtuma)
    })

    select.addEventListener('change', event => {
        let valittu = [...event.target.children].find(c => c.selected);
        haeTapahtuma(valittu)
        haeLipputyypit(valittu)
      });
}

async function haeTapahtuma(valittu){
    const tilausvalikko  = document.getElementById("tilausvalikko");
    tilausvalikko.hidden = false;

    var headers = new Headers({
        'Authorization': `Basic ${token}`
    });

    const tapahtumaresponse = await fetch(`${URL}/tapahtumat/${valittu.id}`, { headers: headers })
    const tapahtumajson = await tapahtumaresponse.json();

    const container = document.getElementById("tapahtumatiedot");
    container.innerHTML = "";

    const nimi = document.createElement("h3");
    nimi.innerHTML = `${tapahtumajson.nimi}`

    var s = new Date(tapahtumajson.aika)
    let d = new Date(Date.parse(s));
    const aika = document.createElement("span");
    aika.innerHTML = `${d.toLocaleString()}`

    const paikka = document.createElement("span");
    paikka.innerHTML = `${tapahtumajson.paikka}`

    container.appendChild(nimi);
    container.appendChild(aika);
    container.appendChild(paikka);
} 

async function haeLipputyypit(valittu){
    var headers = new Headers({
        'Authorization': `Basic ${token}`
    });

    const lipputyyppiresponse = await fetch(`${URL}/lipputyypit`, { headers: headers })
    const lipputyyppijson = await lipputyyppiresponse.json();
   
    const div  = document.getElementById("lipputyypit");
    div.innerHTML = "";
    const taulu = document.createElement('div');
    taulu.id = "taulu";

    lipputyyppijson.forEach((lipputyyppi) => {
        if (lipputyyppi.tapahtuma == valittu.id) {
            const option = document.createElement('form')
            option.id = lipputyyppi.id
            option.innerHTML = `
            <label>${lipputyyppi.nimi} &nbsp;&nbsp; ${lipputyyppi.hinta}€ &nbsp;&nbsp;</label>
            <div class="inputs">
                <input type="hidden" id="id" name="id" value="${lipputyyppi.id}">
                <input type="hidden" id="nimi" name="nimi" value="${lipputyyppi.nimi}">
                    <input type="number" id="maara" name="maara" min="0" value="0"> kpl
                    <input type="text" id="myyntihinta" name="myyntihinta" value="${lipputyyppi.hinta}">
                    <img src="images/discount.png" />
            <br>
            `
            taulu.appendChild(option)
    }
    else {
        taulu.innerHTML = "";
    }
    })

    div.appendChild(taulu);

    const submitButton = document.createElement('button')
    submitButton.onclick = submitAll
    submitButton.value = "Submit"
    submitButton.innerHTML = "Submit"
    div.appendChild(submitButton)

    function submitAll() {
        var forms = document.querySelectorAll("form");
        var result = Array.from(forms).map(a => {
            var obj = {};
            Array.from(a.querySelectorAll("[name]")).forEach(b => {
                obj[b.getAttribute("name")] = b.value;
            });
            return obj;
        });

        luoTilaus(valittu, result);
    }

    function luoTilaus(valittu, result) {
        fetch(`${URL}/tilaukset`, {
                method: 'POST',
                body: JSON.stringify({
                    kayttaja: 3,
                }),
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
            })
            .then((response) => response.json())
            .then((tilaus) => vieLiputTilaukseen(valittu, result, tilaus))
    }

    function vieLiputTilaukseen(valittu, result, tilaus) {
    
        result.forEach((result) => {
            if(result.maara == null) {
                console.log('Ei valittuja lippuja tälle lipputyypille')
            }
            else {
                for(var i = 0; i < result.maara; i++) {
                    fetch(`${URL}/liput`, {
                        method: 'POST',
                        body: JSON.stringify({
                            lipputyyppiId: result.id,
                            tilausId: tilaus.id,
                            myyntihinta: result.myyntihinta
                        }),
                        headers: {
                            'Content-type': 'application/json',
                            'Authorization': `Basic ${token}`
                        },
                    })
                    .then((response) => response.json())
                    .then((data) => console.log(data))
                }
            }
            

        })
        setTimeout(function() { haeTilaus(valittu, tilaus); }, 3000);
    }
}

async function haeTilaus(valittu, tilaus) {

    var headers = new Headers({
        'Authorization': `Basic ${token}`
    });

    const liputresponse = await fetch(`${URL}/liput`, { headers: headers })
    const liputjson = await liputresponse.json();

    const container = document.getElementById("liput");
    container.innerHTML = "";

    liputjson.forEach((lippu) => {
        if (lippu.tilausId == tilaus.id) {
            const tieto = document.createElement('div')
            tieto.id = lippu.id
            tieto.className = "lipputyyli"
            var s = new Date(lippu.myyntiaika)
            let d = new Date(Date.parse(s));
            tieto.innerHTML = `
            <div class="lipputausta">
                <h3>${valittu.value}</h3>
                <p> Lipputunnus: ${lippu.lipputunnus}</p>
                <p>Hinta: ${lippu.myyntihinta} €</p>
                <p>Myyty: ${d.toLocaleString()}</p>
                <p>Tilaus: ${lippu.tilausId}</p>
            </div>
            `
            container.appendChild(tieto)
        }
    })
}
