
/* GLOBAL VARIABLES */
const LoginStatus = Object.freeze( {
    NONE : 0,
    USER : 1,
    ADMIN : 2
});

const FIELDS = {
        week:       {label: "Vecka", label2: "V.", type: "number", req: true},
        date:       {label: "Datum", label2: "Dat.", type: "date", req: true},
        ph:         {label: "pH", label2: "pH", type: "number", req: true},
        wm:         {label: "Vatten (m3)", label2: "m3", type: "number", req: true},
        salt:       {label: "Salt á 25 kg", label2: "Salt", type: "number", req: true},
        phplus:     {label: "pH+ (kg)", label2: "ph+", type: "number", req: true},
        phturbo:    {label: "pH turbo (kg)", label2: "pH T", type: "number", req: true},
        phfluid:    {label: "pH-kärl innan fyll (l)", label2: "kärl", type: "number", req: true},
        fluidadd:   {label: "Tillsatt vatten (l)", label2: "tills.", type: "number", req: true},
        sign:       {label: "Signeras", label2: "sign.", type: "string", req: true},
        note:       {label: "Notering", label2: "not.", type: "string", req: false}
    }

let isLoggedIn;

// Local testing
const BASE_URL = "http://localhost:3000/api";
// LAN testing
//const BASE_URL = "http://192.168.0.132:3000/api";
// Deployment
//const BASE_URL = "/api";

window.onload = init();

/**
 * Starting point.
 * Sets up listeners for navigation button / links and shows the login page.
 */
function init() {

     // Setup navigation links
    document.getElementById("navMenuToggle").addEventListener("click", function() {
        if (isLoggedIn !== LoginStatus.NONE) showHideNav();
        else {
            alert("Du måste logga in först");
            loginMenu(getRecords);
        }
    });
    document.getElementById("navLogOut").addEventListener("click", function() { logOutRequest(loginMenu()) });
    document.getElementById("navNewRec").addEventListener("click", newRecord);
    document.getElementById("navListRec").addEventListener("click", function() { getRecords(null) });
    document.getElementById("navNewMain").addEventListener("click", newMaintenanceMenu);
    document.getElementById("navListMain").addEventListener("click", function() { fetchMaintenance(listMaintenanceMenu); });
    document.getElementById("navChangePass").addEventListener("click", changePasswordMenu);
    document.getElementById("navExpCsv").addEventListener("click", downloadCsv);
    document.getElementById("navAdminMenu").addEventListener("click", adminMenu);

    // Hide the navigationpane after clicking on an element
    for (let link of document.getElementsByClassName("nav")) link.addEventListener("click", showHideNav);

    // If logged in show the records, otherwise go first to login page.
    getLoginStatus(getRecords, loginMenu(getRecords));
}

/**
 * Shows / Hides the navigation-pane
 */
function showHideNav() {
    const pane = document.getElementById("nav_links");
    if (pane.style.display === "block") {
        pane.style.display = "none";
    } else {
        pane.style.display = "block";
    }
}

/**
 * Sends a server request to check if user is logged in and whether it is admin. Updates and calls a function depending on result.
 * @param funcLoggedIn Function to call if logged in
 * @param funcLoggedOut Function to call if not logged in.
 */
function getLoginStatus(funcLoggedIn, funcLoggedOut) {
    fetch(BASE_URL + "/loginstatus", {
        credentials: "include",
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }})
        .then((response) => {
            if (!response.ok) return Promise.reject(response);
            return response.json();
        })
        .then((json) => {
            if (json.user || json.admin) {
                loggedIn(json.admin? LoginStatus.ADMIN : LoginStatus.USER);
                if (funcLoggedIn) funcLoggedIn();
            } else {
                loggedIn(LoginStatus.NONE);
                if (funcLoggedOut) funcLoggedOut();
            }
        })
        .catch((err) => {
            loggedIn(LoginStatus.NONE);
            console.log("Error checking if logged in " + err);
            if (funcLoggedOut) funcLoggedOut();
        })
}

/**
 * Sets the login status and reflects the view depending on whether user is logged in or not and whether his is admin
 * @param loggedIn
 */
function loggedIn(loggedIn) {
    // The menu toggle button is automatically enabled / disabled
    isLoggedIn = loggedIn;
    document.getElementById("navMenuToggle").innerText = (isLoggedIn === LoginStatus.NONE)? "X" : "=";

    const adminLink = document.getElementById("navAdminMenu");
    if (isLoggedIn === LoginStatus.ADMIN) adminLink.classList.remove("hidden");
    else adminLink.classList.add("hidden");

    if (isLoggedIn === LoginStatus.NONE) loginMenu(getRecords);
}

/**
 * Display list of maintenances
 * @param main fetched maintenances from server
 */
function listMaintenanceMenu(main) {

    // If function is called without "main" (maintenance) argument
    if (!main) {
        fetchMaintenance(listMaintenanceMenu);
        return;
    }

    // Check screen size
    let mobile = window.matchMedia("(max-width: 800px)").matches;

    const table = document.createElement("table");
    table.classList.add("fl-table");

    // Table header
    table.innerHTML = `
        <thead>
            <tr>
                <th>Namn</th><th>Period</th><th>${!mobile? "Instruktion" : "Instr."}</th>
            </tr>
        </thead>`;

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    for (let m of main) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${m.title}</td>
            <td>${m.period}</td>
            <td>${m.instruction}</td>
        `;
        row.addEventListener("click", () => editMaintenanceMenu(m, updateMaintenance) );
    }

    const display = document.getElementById("displayArea");
    display.classList.add("table-wrapper");
    display.innerHTML = "";
    display.appendChild(table);
}

function adminMenu() {
    console.log("admin menu");
    const display = document.getElementById("displayArea");
    display.innerHTML = `
        <table class="input-table">
            <thead><tr><th>Lägg till ny användare</th><th></th></tr></thead>
            <tr><th>Användarnamn</th><th><input type = "text" id = "username" name = "username" class="required"></th></tr>
            <tr><th>Lösenord</th><th><input type = "password" id = "password" name = "password" class="required"></th></tr>
            <tr><th>Signatur</th><th><input type = "text" id = "sign" name = "sign" class="required"></th></tr>
            <tr><th>Telefon</th><th><input type = "text" id = "phone" name = "phone"></th></tr>
            <tr><th>Adress</th><th><input type = "text" id = "address" name = "address"></th></tr>                
            <tr><th>Administratör</th><th><input type = "checkbox" id = "admin" name = "admin"></th></tr>
        </table>
   `
    const requiredInputs = document.getElementsByClassName("required");
    console.log(requiredInputs.length);

    for (let input of requiredInputs) {
        // A field that has been marked as illegal input goes back to normal upon new input
        input.addEventListener("input",() => input.classList.remove("illegal"));
        // When focus of an input field is lost, check for correct input
        input.addEventListener("blur", () => checkFields(new Array(input)) );
    }

    const createUserBtn = document.createElement("button");
    createUserBtn.addEventListener("click", () => {

        const userInp = document.getElementById("username");
        const passwInp = document.getElementById("password");
        const adminInp = document.getElementById("admin");
        const signInp = document.getElementById("sign");
        const phoneInp = document.getElementById("phone");
        const addressInp = document.getElementById("address");

        if (userInp.value.length < 4) alert("Det nya användarnamnet måste vara minst 4 tecken långt");
        else if (passwInp.value.length < 4) alert("Det nya lösenordet måste vara minst 4 tecken långt");
        else {

            const newUser = {
                username: userInp.value,
                password: passwInp.value,
                admin: adminInp.checked,
                sign: signInp.value,
                phone: phoneInp.value,
                address: addressInp.value
            };

            createUserRequest(newUser, function() {
                // After successful creation of new user
                alert("Användaren skapad")
                userInp.value = "";
                passwInp.value = "";
                adminInp.checked = false;
                signInp.value = "";
                phoneInp.value = "";
                addressInp.value = "";
            });
        }

    });

    createUserBtn.textContent = "Skapa användare";
    display.appendChild(createUserBtn);
}

function createUserRequest(newUser, next) {

    fetch(BASE_URL + "/newuser", {
        credentials: "include",
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newUser)
    })
    .then((result) => {
        if (!result.ok) return Promise.reject(result);
        return result.json();
    })
    .then((json) => {
        console.log(json);
        if (!json) return Promise.reject(json);
        if (next) next();
    })
    .catch((err) => {
        console.log(err);
        switch(err.status) {
            case 401: alert("Du är inte inloggad. Logga in och försök igen"); break;
            case 403: alert("Du är inte admin och kan därför inte skapa nya användare"); break;
            case 409: alert("Användarnamnet finns redan"); break;
            case 500: alert("Serverfel. Försök senare eller kontakta admin"); break;
            default: alert("Okänt fel. Kontakta admin");
        }
        console.log("Error: " + "\t" + err.status + "\t" + err.statusText) });

}

/**
 * Login and then call <<next>> function
 * @param next function to call on successful login
 */
function login(next) {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log("logging in with username " + username);

    fetch(BASE_URL + "/login", {
        credentials: "include",
        method : 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username : username,
            password : password
        })})
        .then((result) => {
            console.log(result.statusText);

            result.json()
                .then((user) => {
                    if (user.error) alert("Felaktig inloggning");
                    else {
                        sessionStorage.setItem("sign", user.sign);
                        loggedIn(user.admin? LoginStatus.ADMIN : LoginStatus.USER);
                        next();
                    }
                })

        })
        .catch((err) => console.log(err));
}

/**
 * Opens the login dialog
 * @param next Function to call after successful login
 */
function loginMenu(next) {

    const display = document.getElementById("displayArea");
    display.innerHTML = `
        <table class="input-table">
            <thead><tr><th>Inloggningsuppgifter</th><th></th></tr></thead>
            <tr><th>Användarnamn</th><th><input type = "text" id = "username" name = "username"></th></tr>
            <tr><th>Lösenord</th><th><input type = "password" id = "password" name = "password"></th></tr>
        </table>
   `
    const loginBtn = document.createElement("button");
    loginBtn.textContent = "Logga in";
    loginBtn.addEventListener("click", () => {
        if (!next) login(getRecords);
        else login(next);
    });

    display.appendChild(loginBtn);
}

/**
 * Send log out request to server and update UI.
 * @param next function to call after log out.
 */
function logOutRequest(next) {
    fetch(BASE_URL + "/logout", {
        credentials: "include",
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    })
        .then((result) => {
            if (!result.ok) return Promise.reject(result);
            loggedIn(LoginStatus.NONE);
            if (next) next();
        })
        .catch((err) => {
            console.log("Error: " + "\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loginMenu();
                alert("Du är redan utloggad")
            } else alert("Misslyckades logga ut. Kontrollera internetanslutningen");
        })
}

/**
 * Creates the new record on the server, then calls next
 * @param record the record to create
 * @param next the function to call when finished
 */
function createRecord(record, next) {

    fetch(BASE_URL + "/add", {
        credentials: "include",
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(record)
    })
        .then((result) => {
            if (!result.ok) return Promise.reject(result);
            if (next) next();
        })
        .catch((err) => {
            console.log("Error: " + "\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loggedIn(LoginStatus.NONE);
                function next() { editRecord(record, createRecord) };               //loginMenu(editRecord(record, updateRecord));
                loginMenu(next);
                alert("Du är inte inloggad. Logga in och försök igen.")
            } else alert("Misslyckades spara ny avläsning. Försök igen");
        });
}

/**
 * Retrieve all records from the server
 */
function getRecords(next) {
    console.log("getting records..");
    fetch(BASE_URL + "/getall", {
        credentials: "include",
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }})
        .then((result) => {
            if (!result.ok)  return Promise.reject(result);
            result.json().then((json_result) => {
                if (!next) displayRecords(json_result);
                else next(json_result);
            })

        })
        .catch((err) => {
            console.log("Error getting records\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loggedIn(LoginStatus.NONE);
                function next() { changePasswordMenu }
                loginMenu(next);
                alert("Du är inte inloggad. Logga in och försök igen.")
            } else alert("Misslyckades hämta avläsningar. Försök igen");
        });
}

/**
 * Updates the record to the server, then calls next()
 * @param record the record
 * @param next next function to call
 */
function updateRecord(record, next) {

    fetch(BASE_URL + "/edit", {
        credentials: "include",
        method: "PUT",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(record)
    })
        .then((result) => {
            if (!result.ok) return Promise.reject(result);
            next();
    })
        .catch((err) => {
            console.log("Error: " + "\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loggedIn(LoginStatus.NONE);
                function next() { editRecord(record, updateRecord) }
                //loginMenu(editRecord(record, updateRecord));
                loginMenu(next);
                alert("Du är inte inloggad. Logga in och försök igen.")
            } else alert("Misslyckades uppdatera avläsning. Försök igen");
        });
}

/**
 * Display a passwod change menu
 * @param next function to call next
 */
function changePasswordMenu(next) {
    const display = document.getElementById("displayArea");
    display.innerHTML = `
        <table class="input-table">
            <thead><tr><th>Byt lösenord</th><th></th></tr></thead>
            <tr><th>Nuvarande lösenord</th><th><input type = "password" id = "oldpassword" name = "OldPassword" class="required"></th></tr>
            <tr><th>Nytt lösenord</th><th><input type = "password" id = "newpassword1" name = "newPassword1" class="required"></th></tr>
            <tr><th>Nytt lösenord igen</th><th><input type = "password" id = "newpassword2" name = "newPassword2" class="required"></th></tr>
        </table>
   `
    const requiredInputs = document.getElementsByClassName("required");

    for (let input of requiredInputs) {
        // A field that has been marked as illegal input goes back to normal upon new input
        input.addEventListener("input",() => input.classList.remove("illegal"));
        // When focus of an input field is lost, check for correct input
        input.addEventListener("blur", () => checkFields(new Array(input)) );
    }

    const changePasswordBtn = document.createElement("button");
    changePasswordBtn.addEventListener("click", () => {
        const old = document.getElementById("oldpassword").value;
        const new1 = document.getElementById("newpassword1").value;
        const new2 = document.getElementById("newpassword2").value;
        if (new1 !== new2) alert("De två nya lösenorden är olika!");
        else if (new1.length < 4) alert("Det nya lösenordet måste vara minst 4 tecken långt");
        else updatePassword(old, new1, function() { alert("Lösenordet ändrat!") });
    });

    changePasswordBtn.textContent = "Byt lösenord";
    display.appendChild(changePasswordBtn);
}

/**
 * Sends a request to the server to update a users password
 * @param oldPassword The current password
 * @param newPassword The new password
 * @param next Function to call if request was successful
 */
function updatePassword(oldPassword, newPassword, next) {

    const passwordRequest = {
        oldpassword : oldPassword,
        newpassword : newPassword
    };

    fetch(BASE_URL + "/changepass", {
        credentials: "include",
        method: "PUT",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(passwordRequest)
    })
        .then((result) => {
                if (!result.ok) return Promise.reject(result);
                console.log("changed password");
                if (next) next();
    })
        .catch((err) => {
            console.log("Error when trying to change password\t" + err.status + "\t" + err.statusText);
            if (err.status === 401) alert("Fel lösenord!");
            else alert("Fel inträffade, försök igen");
        });
}

/**
 * Send server request to delete a racord.
 * @param record to delete
 * @param next function to call after delete
 */
function delRecord(record, next) {
    console.log("Deleting record");

    fetch(`${BASE_URL}/delete/${record._id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    })
        .then((result) => {
            if (!result.ok) return Promise.reject(result);
            next();
        })
        .catch((err) => {
            console.log("Error: " + "\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loggedIn(LoginStatus.NONE);
                loginMenu();
                alert("Du är inte inloggad. Logga in och försök igen.")
            } else alert("Misslyckades radera avläsning. Försök igen");
        });
}

/**
 * Send server request to create a new maintenance
 * @param maintenance
 */
function createMaintenance(maintenance) {

    fetch(BASE_URL + "/maintenance/new", {
        credentials: "include",
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(maintenance)
    })
        .then((result) => {
            if (!result.ok) return Promise.reject(result);
            listMaintenanceMenu();
        })
        .catch((err) => {
            console.log("Error: " + "\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loggedIn(LoginStatus.NONE);
                function next() { editMaintenanceMenu(maintenance, createMaintenance) }
                loginMenu(next);
                alert("Du är inte inloggad. Logga in och försök igen.")
            } else alert("Misslyckades spara ny underhållsrutin. Försök igen");
        });
}

/**
 * Fetch maintenance and then call next function
 * @param next function to call when finished
 */
function fetchMaintenance(next) {
    fetch(BASE_URL + "/getmain", {
        credentials: "include",
        method: "GET",
        redirect: "follow",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }})
        .then((result) => {

            if (!result.ok) {
                console.log("Failed to fetch, not logged in\n" + result.statusText);
                loginMenu();
                return;
            }

            result.json()
                .then((json) => next(json))
                .catch((err) => console.log(err))

        })
        .catch((err) => {
            alert("Misslyckades hämta underhållsrutiner")
            console.log(err)
        })
}

/**
 * Update a maintenance item to the server
 * @param maintenance
 */
function updateMaintenance(maintenance) {

    fetch(BASE_URL + "/maintenance/edit", {
        credentials: "include",
        method: "PUT",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(maintenance)
    })
        .then((result) => {
            if (!result.ok) return Promise.reject(result);
            listMaintenanceMenu();
        })
        .catch((err) => {
            console.log("problem updating maintenance in db: " + "\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loggedIn(LoginStatus.NONE);
                function next() { editMaintenanceMenu(maintenance, updateMaintenance) }
                loginMenu(next);
                alert("Du är inte inloggad. Logga in och försök igen.")
            } else alert("Misslyckades uppdatera underhållsrutin. Försök igen");
        });

}

/**
 * Sends server request to delete a maintenance
 * @param maintenance
 * @param next function to call after deletion
 */
function delMaintenance(maintenance, next) {
    console.log("Deleting maintenance");

    fetch(`${BASE_URL}/maintenance/${maintenance._id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    })
        .then((result) => {
            if (!result.ok) return Promise.reject(result);
            console.log(result.statusText);
            next();
        })
        .catch((err) => {
            console.log("Error: " + "\t" + err.status + "\t" + err.statusText);
            if (err.status >= 401 && err.status <= 403) {
                loggedIn(LoginStatus.NONE);
                loginMenu(listMaintenanceMenu);
                alert("Du är inte inloggad. Logga in och försök igen.")
            } else alert("Misslyckades radera underhållsrutin. Försök igen");
        });
}

/**
 * Produce and display a table of all the records
 * @param records
 */
function displayRecords(records) {

    // Check screen size
    let mobile = window.matchMedia("(max-width: 800px)").matches;

    const table = document.createElement("table");
    table.classList.add("fl-table");

    // Table header
    const thead = document.createElement("thead");
    table.appendChild(thead);
    const headerRow = thead.insertRow();
    for (let i in FIELDS) {
        const th = document.createElement("th");
        th.innerHTML = !mobile? FIELDS[i].label : FIELDS[i].label2;
        headerRow.appendChild(th);
    }

    const th = document.createElement("th");
    th.innerHTML = !mobile? "Underhållstyp" : "underh.";
    headerRow.appendChild(th);

    // Table body
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    // Iterate over the records (showing the latest first)
    //for (let r in records) {
    for (let r = records.length - 1; r >= 0; r--) {
        const tr = tbody.insertRow();
        tr.addEventListener("click", () => editRecord(records[r], updateRecord));

        // Produce a cell for each value
        for (let key in FIELDS) {
            let td = document.createElement("td");
            if (records[r][key] !== undefined) {
                if (key == "date") td.innerText = getDate(records[r][key]);
                else td.innerText = records[r][key];
            } else td.innerText="";
            tr.appendChild(td);
        }

        // Produce an entry for each maintenance item
        let td = tr.insertCell();
        for (let m in records[r].main) {
            if (td.innerHTML.length > 0) td.appendChild(document.createTextNode(`, `));
            td.appendChild(document.createTextNode(records[r].main[m].title));
        }
    }

    const display = document.getElementById("displayArea");
    display.classList.add("table-wrapper");
    display.innerHTML = "";
    display.appendChild(table);
}

/**
 * Create a new record
 */
function newRecord() {

    const record = {
        week: getWeek(),
        date: getDate(new Date()),
        sign: sessionStorage.getItem("sign"),
        main: []
    }

    editRecord(record, createRecord);
}

/**
 * Edit a record (Handles both edit and new)
 * @param record the record
 * @param storeFunc call this function when done
 */
function editRecord(record, storeFunc) {

    // Create a table
    const table = document.createElement("table");
    table.classList.add("input-table");

    // Add a header to the table
    const thead = document.createElement("thead");
    table.appendChild(thead);
    const headerRow = thead.insertRow();
    const th = document.createElement("th");
    th.innerHTML = "Lägg till / redigera avläsning";
    th.style.width = "25%";
    headerRow.appendChild(th);
    headerRow.appendChild(document.createElement("th"));


    // Create a table row for all fields
    for (let field in FIELDS) {

        const tr = table.insertRow();
        tr.insertCell().appendChild(document.createTextNode(FIELDS[field].label));

        const input = document.createElement("input");
        const required = FIELDS[field].req;
        if (required) input.classList.add("required");

        if (FIELDS[field].type === "number") {

            // Affects the virtual keyboard on mobile devices
            input.inputMode = "decimal";    // This property is also used when validating input
            input.pattern = "[0-9]*";

            // Allow only digits and decimal character (.) to be added into the field (, converts to .)
            const regex = /[^0-9|/.]/g;
            const regex2 = /,/g
            input.addEventListener("input", () => {
                input.value = input.value.replace(regex2, ".");
                input.value = input.value.replace(regex, "")
            });
        }

        // A field that has been marked as illegal input goes back to normal upon new input
        input.addEventListener("input",() => input.classList.remove("illegal"));

        // When focus of an input field is lost, check for correct input (if required) and get the content
        input.addEventListener("blur", () => {
            if (required) {
                if (checkFields(new Array(input))) record[field] = input.value;
            } else record[field] = input.value;
        });

        // Pre-fill the inputs
        if (FIELDS[field].type === "date") {
            input.type = "date";
            input.value = getDate(record[field]);
        } else input.value = record[field];

        // Leave blank input when missing data
        if (input.value === "undefined") input.value ="";

        tr.insertCell().appendChild(input);
    }

    // Print maintenance of this record
    const tr = table.insertRow();
    tr.insertCell().appendChild(document.createTextNode("Underhållsrutiner"));

    // Add maintenance button
    const addBtn = document.createElement("button");
    addBtn.addEventListener("click", () => addMain(record, storeFunc));
    addBtn.textContent = "Lägg till / Ta bort";

    tr.insertCell().appendChild(addBtn);

    // One entry for each maintenance
    for (let i in record.main) {
        const tr = table.insertRow();
        tr.insertCell();        // EMPTY CELL
        tr.insertCell().appendChild(document.createTextNode(record.main[i].title));
    }

    // SAVE BUTTON
    const saveBtn = document.createElement("button");

    saveBtn.addEventListener("click", () => {
        // Send server request after validating required user input
        if (checkFields(document.getElementsByClassName("required"))) storeFunc(record, getRecords);
    });
    saveBtn.textContent = "Spara";

    // DELETE BUTTON
    const delBtn = document.createElement("button");
    delBtn.addEventListener("click", () => {
        if (window.confirm("Är du säker på att du vill radera avläsningen?")) delRecord(record, getRecords);
    });
    delBtn.textContent = "Radera";

    // DISPLAY
    const display = document.getElementById("displayArea");
    display.innerHTML = "";
    display.appendChild(table);
    display.appendChild(saveBtn);
    display.appendChild(delBtn);
}

/**
 * Create a new maintenance item
 */
function newMaintenanceMenu() {
    const maintenance = {
        period : 7,
        title : "",
        instruction : ""
    }
    editMaintenanceMenu(maintenance, createMaintenance);
}

/**
 * Shows the menu to edit a maintenance item
 * @param maintenance
 * @param storeFunc function to handle the api call
 */
function editMaintenanceMenu(maintenance, storeFunc) {

    // Create a table
    const table = document.createElement("table");
    table.classList.add("input-table");

    // Add a header to the table
    const thead = document.createElement("thead");
    table.appendChild(thead);
    const headerRow = thead.insertRow();
    const th = document.createElement("th");
    th.innerHTML = "Lägg till / redigera underhållsrutin";
    th.style.width = "25%";
    headerRow.appendChild(th);
    headerRow.appendChild(document.createElement("th"));

    /** Title **/
    {
        const tr = table.insertRow();
        let cell = document.createElement("p");
        cell.innerText = "Titel";
        tr.insertCell().appendChild(cell);
        const input = document.createElement("input");
        input.type = "text";
        input.value = maintenance.title;
        input.classList.add("required");
        input.addEventListener("input",() => input.classList.remove("illegal"));
        input.addEventListener("change", () => maintenance.title = input.value );
        tr.insertCell().appendChild(input);
    }

    /** Instructions **/
    {
        const tr = table.insertRow();
        let cell = document.createElement("p");
        cell.innerText = "Instruktioner";
        tr.insertCell().appendChild(cell);
        const input = document.createElement("textarea");
        input.rows = 5;
        input.value = maintenance.instruction;
        input.classList.add("required");
        input.addEventListener("input",() => input.classList.remove("illegal"));
        input.addEventListener("change", () => maintenance.instruction = input.value );
        tr.insertCell().appendChild(input);
    }

    /** Period **/
    {
        const tr = table.insertRow();
        let cell = document.createElement("p");
        cell.innerText = "Intervall (dagar)";
        tr.insertCell().appendChild(cell);
        const input = document.createElement("input");
        input.type = "number";
        input.value = maintenance.period;
        input.addEventListener("change", () => maintenance.period = input.value );
        tr.insertCell().appendChild(input);
    }

    // SAVE BUTTON
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Spara";
    saveBtn.addEventListener("click", () => {
        if (checkFields(document.getElementsByClassName("required"))) storeFunc(maintenance) });

    // DELETE BUTTON
    const delBtn = document.createElement("button");
    delBtn.textContent = "Radera";
    delBtn.addEventListener("click", () => {
        if (window.confirm("Är du säker på att du vill radera underhållsrutinen?")) delMaintenance(maintenance, listMaintenanceMenu);
    })

    const display = document.getElementById("displayArea");
    display.innerHTML = "";
    display.appendChild(table)
    display.appendChild(saveBtn);
    display.appendChild(delBtn);
}

/**
 * Popup to add new maintenance to a record
 * @param record the record
 * @param storeFunc doesn't matter, just pass the argument back to the caller when finished
 */
function addMain(record, storeFunc) {
    const display = document.getElementById("displayArea");

    // Create a table
    const table = document.createElement("table");
    table.classList.add("input-table");

    // Add a header to the table
    const thead = document.createElement("thead");
    table.appendChild(thead);
    const headerRow = thead.insertRow();
    const th = document.createElement("th");
    th.innerHTML = "Utförda underhållsrutiner";
    headerRow.appendChild(th);
    headerRow.appendChild(document.createElement("th"));

    fetchMaintenance((json) => {
        display.innerText ="";

        // Store all maintenance items and their checkbox input
        const map = new Map();

        for (let m of json) {
            const row = table.insertRow();
            const checkbox = document.createElement("input");
            checkbox.type="checkbox";

            // Check active maintenance checkboxes
            if (record.main)
                for (let mt of record.main) if (m._id == mt._id) checkbox.checked = true;

            // Add to the table row
            row.insertCell().appendChild(document.createTextNode(m.title));
            row.insertCell().appendChild(checkbox);

            // Store the id of current maintenance with its checkbox
            map.set(m, checkbox);
        }

        // SAVE BUTTON
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Spara";
        saveBtn.addEventListener("click", () => {

            // Add all selected options to the record
            let newMain = [];
            for (let[maint, checkbox] of map) {
                if (checkbox.checked) newMain.push(maint);
            }
            record.main = newMain;

            // Reload the edit record menu
            editRecord(record, storeFunc);
        })

        // CANCEL BUTTON
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Avbryt";
        cancelBtn.addEventListener("click",() => editRecord(record, storeFunc));

        // Add the HTML to the page
        display.appendChild(table);
        display.appendChild(saveBtn);
        display.appendChild(cancelBtn);
    });


}

/**
 * Download all records in a CSV file
 */
function downloadCsv() {

    /**
     * Subfunction as callback.
     * Creates a blob which is downloaded as a file by the browser.
     * @param records all the records
     */
    function createFile(records) {
        let csv = "";
        for (let i in FIELDS) {
            if (csv.length > 0) csv += ", ";
            csv += FIELDS[i].label;
        }

        for (let r = 0; r < records.length; r++) {
            let row = "";
            for (let key in FIELDS) {
                if (row.length > 0) row += ", ";
                if (records[r][key] !== "undefined" && records[r][key]){
                    if (key == "date") row += getDate(records[r][key]);
                    else row += records[r][key];
                }
            }
            csv += "\n" + row;
        }

        const blob = new Blob([csv], {type: "text/plain"});
        const url = window.URL.createObjectURL(blob);
        let anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "records.csv";
        anchor.click();
        window.URL.revokeObjectURL(url);
    }

    getRecords( createFile );
}

/**
 * Get the date with format YYYY-MM-DD
 * @param date the date to convert
 * @returns {string} formatted date
 */
function getDate(date) {
    try {
        const d = new Date(date);
        return d.toISOString().split("T")[0];
    } catch (err) {
        console.log(err);
        return "";
    }
}

/**
 * Get the current week
 * @returns {number}
 */
function getWeek() {
    const d = new Date();
    d.setHours(0,0,0,0);

    // Thursday in current week decides the year.
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(d.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Check input fields and mark illegal ones
 * @param elements Elements to check
 */
function checkFields(elements) {

    let ok = true;

    for (let input of elements) {

        // Checking for empty inputs and invalid number-marked inputs
        if (!input.value || (input.inputMode === "decimal" && isNaN(input.value))) {
            ok = false;
            input.classList.add("illegal");
        } else input.classList.remove("illegal");
    }

    return ok;
}