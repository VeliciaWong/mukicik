const admin                 = require("firebase-admin");
const functions             = require("firebase-functions");
const bodyParser            = require("body-parser");
const express               = require('express');
const expressLayouts        = require('express-ejs-layouts');
const cookieParser          = require("cookie-parser");
const crypto                = require("crypto");
const cryptoRandomString    = require('crypto-random-string');
const { debug }             = require("firebase-functions/lib/logger");
const { info }              = require("firebase-functions/lib/logger");
const { log }               = require("firebase-functions/lib/logger");
const { warn }              = require("firebase-functions/lib/logger");
const { error }             = require("firebase-functions/lib/logger");
const { serialize }         = require("v8");
const { url }               = require("inspector");
const { errorHandler}       = require("./middleware/errorHandler");


admin.initializeApp({
    credential: admin.credential.cert(require('./service-account.json')),
    databaseURL: "https://mukicik-shintavr-default-rtdb.firebaseio.com"
});

/**
 * Attaches a CSRF token to the request.
 * @param {string} url The URL to check.
 * @param {string} cookie The CSRF token name.
 * @param {string} value The CSRF token value to save.
 * @return {function} The middleware function to run.
 */

function attachCsrfToken(url, cookie, value) {
    return function (req, res, next) {
        if (req.url == url) {
            res.cookie(cookie, value);
        }
        next();
    }
}

const firestore = admin.firestore(); // inisialisasi firestore
const app = express();
const isSecure = (process.env.NODE_ENV === 'development') ? false : true;
const sessionName = (process.env.NODE_ENV === 'development') ? 'session' : '__session';
const bookController = require('./controller/bookController')
const authorController = require('./controller/authorController')

app.set('view engine', 'ejs');
app.engine("html", require("ejs").renderFile);
app.use(express.static(__dirname + '/views/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
// Attach CSRF token on each request.
app.use(attachCsrfToken('/login', 'csrfToken', cryptoRandomString({ length: 80, type: 'base64' }))); 
//========================================================================//
//implementation update 
app.use('/mukicik/books', require('./route/bookRoute'));
app.use(errorHandler);
//========================================================================//
app.get('/login', (req, res) =>{res.render("login.html");})
// app.get('/', (req, res) => { res.render("login.html"); })

app.post("/adminLogin", (req, res) => {

    // Get ID token and CSRF token.
    // const idToken = req.body.idToken.toString();
    var idTokenResult = req.body.idTokenResult;

    const csrfToken = req.headers['csrf-token'].toString(); // Reference Line :71

    // Guard against CSRF attacks.
    if (!req.cookies || csrfToken !== req.cookies.csrfToken) {
        error("Got CSRF Attack");
        res.status(401).send('UNAUTHORIZED REQUEST!');
        return;
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    let decodedUserInfo = null;

    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // We could also choose to enforce that the ID token auth_time is recent.
    // admin.auth().verifyIdToken(idToken).then((decodedClaims) => {
    console.log(idTokenResult.token);
    admin.auth().verifyIdToken(idTokenResult.token).then((decodedClaims) => {
        decodedUserInfo = decodedClaims;
        // In this case, we are enforcing that the user signed in in the last 5 minutes.
        if (new Date().getTime() / 1000 - decodedClaims.auth_time < 5 * 60) {
            // return admin.auth().createSessionCookie(idToken, {expiresIn: expiresIn});
            return admin.auth().createSessionCookie(idTokenResult.token, { expiresIn: expiresIn });
        }
        throw new Error('UNAUTHORIZED REQUEST!');
    })
        .then((sessionCookie) => {
            // Note httpOnly cookie will not be accessible from javascript.
            // secure flag should be set to true in production.
            const options = { maxAge: expiresIn, httpOnly: true, secure: isSecure /** to test in localhost */ };
            res.cookie(sessionName, sessionCookie, options);

            return firestore.collection("admin").doc(decodedUserInfo.uid).get();
        }).then((doc) => {
            if (!doc.exists) // JIKA USER TERSEBUT TIDAK TERDAFTAR
            {
                firestore.collection('admin').doc(decodedUserInfo.uid).set({ // BIKIN DOCUMENT BARU DENGAN UID USER TERSEBUT
                    role: "guest", // DAN SET ROLE NYA SEBAGAI guest
                });
            }
            else {
                var data = doc.data();
                if (data.role == "admin") {
                    res.end(JSON.stringify({ status: 'success' })); // SELAINNYA, JIKA USER TERSEBUT TERDAFTAR DAN MEMILIKI ROLE admin, maka lempar string success
                }
            }
            res.end(JSON.stringify({ status: 'failed' }));
        })
        .catch((err) => {
            warn("Got CSRF Attack somewhere else " + err);
            console.log(process.env.NODE_ENV);
            res.status(401).send('UNAUTHORIZED REQUEST! ' + err);
        });
});

app.get("/getAllData", async function (req, res) {

    const sessionCookie = req.cookies[sessionName] || "";
    let decodedUserInfo = null;

    if (sessionCookie !== "") {
        admin.auth().verifySessionCookie(sessionCookie, true /** checkRevoked */)
            .then((decodedClaims) => {

                firestore.collection('Books').get().then(snapshot => {
                    const book_list = snapshot.docs.map(doc => Object.assign(doc.data(), { documentId: snapshot.id }));
                    console.log(book_list)
                    res.render("inputBook.html", {book_list: book_list})
                });
                // decodedUserInfo = decodedClaims;
                // const uid = decodedClaims.uid;
 
            }).catch((err) => {
                error("Error when verifying session cookie", err);
                res.redirect("/login");
            });

    }
    else {
        res.redirect("/login")
    }

});

app.get("/logout", async (req, res) =>{

    res.clearCookie(sessionName);
    res.redirect("/login");
});

app.use('/mukicik/newBook', require('./route/bookRoute'));
app.use('/mukicik/home', require('./route/bookRoute'));
app.use('/mukicik/bookDetail', require('./route/bookRoute'));
// app.use('/mukicik/updateBook', require('./route/bookRoute'));
app.use('/mukicik/deleteBook', require('./route/bookRoute'));
app.use('/mukicik/deleteAllBook', bookController.deleteAll);

app.use('/mukicik/newAuthor', require('./route/authorRoute'));
app.use('/mukicik/listofAuthor', require('./route/authorRoute'));
app.use('/mukicik/listofAuthorBook', require('./route/authorRoute'));
app.use('/mukicik/updateAuthor', require('./route/authorRoute'));

exports.app = functions.https.onRequest(app); 