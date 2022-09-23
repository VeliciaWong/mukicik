const admin = require("firebase-admin");
const firestore = admin.firestore();

const AuthorDoc = "Author";
const authorColl = firestore.collection(AuthorDoc)

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

async function registerAuthor(AuthorName) {
    
    let random  = generateRandom(3);
    let docName = "AU" + random;

    const objData = {
        AuthorID: docName,
        AuthorName: AuthorName
    }

    let docRef = authorColl.doc(docName);
    // await docRef.get() 

    try {
        await docRef.set(objData);
    } catch (error) {
        console.log(error);
        return false;
    }
    
    return docRef

  
}

async function registerBook(bookRegisterRef, bookAuthorRef) {

    // console.log({ message: "bookRegisterRef = " },bookRegisterRef)
    // console.log({ message: "bookAuthorRef = " },bookAuthorRef)

    await bookAuthorRef.update({
        bookList : admin.firestore.FieldValue.arrayUnion({
            bpath : bookRegisterRef
        })
    })

}

async function checkAuthor(findParam) {
    
    findParam = (findParam||null)

    // if(findParam == null) return false

    // const data = await Collection.where("AuthorName", "==", findParam).limit(1).get()

    // if(data.empty){
    //     return false
    // }

    // return true

    return await authorColl.where("AuthorName", "==", findParam).limit(1).get().then((querySnapshot) => {

        if(querySnapshot.empty){
            console.log("No Author!");
            return
        }
        else{
            try {
                console.log("Author exists!:");
                // console.log(querySnapshot.docs[0].ref);
                return querySnapshot.docs[0].ref
    
            } catch (error) {
                console.log("Error getting document:", error);
            }
        }
    });

}

async function deleteAuthor(selectedDoc) {

    const docBook = await checkData(selectedDoc);

    if (docBook === false) {
        return false;
    }

    authorColl.doc(selectedDoc).delete();

    return true

}

async function deleteAllAuthor() {

    var snapshot = await authorColl.get()

    snapshot.forEach(element => {
        element.ref.delete()

        return true
    })

    // authorColl.get().then(snapshot => {
    //     snapshot.forEach(element => {
    //         element.ref.delete();
    //     });

    //     return true
    // });

    return false
}

async function updateAuthor(selectedDoc) {

    authorColl.doc(selectedDoc).update({
        bookList : firestore.FieldValue.arrayUnion({
            path : firestore.collection("Books").where("bookName", "==", selectedDoc)
        })
    })

    return true;
}

module.exports = {checkAuthor, registerAuthor, deleteAuthor, deleteAllAuthor, updateAuthor, registerBook};

