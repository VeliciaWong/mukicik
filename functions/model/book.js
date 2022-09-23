const admin = require("firebase-admin");
const firestore = admin.firestore();
const bookRef = firestore.collection("Books")

function generateRandom(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

async function registerBook(bookTitle,bookGenre, bookDescription, bookAuthorRef) {

    let random = generateRandom(3);
    let docName = "BK" + random;

    const objData = {
        bookID: docName,
        bookTitle: bookTitle,
        bookGenre: bookGenre,
        bookDescription: bookDescription,
        bookAuthorRef: bookAuthorRef
    }
   
    let newdoc = bookRef.doc(docName);

    try {
        await newdoc.set(objData);
        return newdoc
    } catch (error) {
        console.log(error);
        return false;
    }
    
    // return false; 
}

async function checkData(findParam){
    const v = findParam;
    var docRef = bookRef.doc(v);

    var doc = await docRef.get()
    
    try {
        if (doc.exists) {
            // console.log("Document data:", doc.data());
            return true
        }
        
    } catch (error) {
        console.log("Error getting document:", error);
    }

    console.log("No such document!");
    return false

}

async function deleteBook(selectedDoc){

    const v = selectedDoc;
    const docBook = await checkData(v);
    
    if(docBook === false){
        return false;
    }

    await bookRef.doc(selectedDoc).delete();

    return true
    
}

async function deleteAllBook(){

    var snapshot = await bookRef.get()

    snapshot.forEach(element => {
        element.ref.delete()

        return true;
    })

    // bookRef.get().then(snapshot => {
    //     snapshot.forEach(element => {
    //         element.ref.delete();
    //     });

    //     return true
    // });

    return false
}

async function updateBook(selectedDoc, BookID, BookTitle, BookDescription, BookReleaseYear,
    BookGenre, BookPageCount, BookPublisher,
    BookAuthorID, BookAuthorName){

    const v = selectedDoc;

    const docBook = await checkData(v);

    if (docBook === false) {
        return false;
    }

    let objData = {
        BookID: "BookID",
        BookTitle: "BookTitle",
        BookDescription: "BookDescription",
        BookReleaseYear: "BookReleaseYear",
        BookGenre: "BookGenre",
        BookPageCount: "BookPageCount",
        BookPublisher: "BookPublisher",
        BookAuthorID: "BookAuthorID",
        BookAuthorName: "BookAuthorName"
    }

    let setDoc = firestore.collection('Books').doc(docBook)
    
    try {
        setDoc.set(objData);
    } catch (error) {
        console.log(error);
        return false;
    }

    return true;
}


module.exports = {checkData, registerBook, deleteBook, deleteAllBook, updateBook};
