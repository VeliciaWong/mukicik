const admin = require("firebase-admin");
const firestore = admin.firestore();
const modelBook = require("../model/book");
const modelAuthor = require("../model/author");
const asyncHandler = require('express-async-handler');
const authorController = require('../controller/authorController');
const bookRef  = firestore.collection("Books")

const getBookNew = async (req, res)=>{
    const snapshot = await bookRef.get()
    const book_list = snapshot.docs.map(doc => Object.assign(doc.data(), { documentId: snapshot.id }));
    res.status(200).render("index.html", { book_list: book_list })
}

const getBook = asyncHandler(async (req, res) => {

    const bookListData = [];
    const snapBooks = await bookRef.get()    
    
    console.log(snapBooks)

    snapBooks.forEach((doc)=>{        
        bookListData.push(doc.data())
    })
    
    console.log(bookListData)

    for(let i=0;i<bookListData.length;i++){
        const dataBook = bookListData[i]
        const getRefAuthor = await dataBook.bookAuthorRef.get()
        const dataRefAuth = getRefAuthor.data()        
        if(getRefAuthor.exists){
            bookListData[i].AuthorID = dataRefAuth.AuthorID
            bookListData[i].AuthorName = dataRefAuth.AuthorName
            bookListData[i].bookList = dataRefAuth.bookList
        }        
    }

    // console.log(bookListData)
    res.render("index.html", { bookListData: bookListData})
});


const getBookDetail = asyncHandler(async (req, res) => {

    const selectedDoc = req.params.book;

    console.log(selectedDoc)

    var bookdata = await bookRef.doc(selectedDoc).get().then(queryResult => {
        console.log(queryResult)
        return queryResult.data()
    });
    // console.log(bookdata)

    var authordata = await bookdata.bookAuthorRef.get().then(snap => {
        // snap.push(snap.data())
        return snap.data()
    })

    console.log(authordata)
    res.status(200).render("bookDetail.html", { bookdata: bookdata, authordata: authordata })
    
})

// @desc    Set goal
// @route   POST /mukicik/library
// @access  Private
const setBook = asyncHandler(async (req, res) => {

    const {bookTitle, bookGenre, bookDescription, bookAuthorName} = req.body

    if (!req.body || req.body === null || typeof req.body === "undefined") {
        res.status(500);
        throw new Error('Something wrong with your input!');
    }

    var bookAuthorRef = await modelAuthor.checkAuthor(bookAuthorName);

    console.log("ini yaaa");
    console.log(bookAuthorRef);
    if (!bookAuthorRef){
        bookAuthorRef = await modelAuthor.registerAuthor(bookAuthorName);
    }

    var bookRegisterRef = await modelBook.registerBook(bookTitle, bookGenre, bookDescription, bookAuthorRef);
    
    if (bookRegisterRef) {
        await modelAuthor.registerBook(bookRegisterRef, bookAuthorRef)
        // res.status(200).json({ message: "Book added successfully!" });
        res.redirect("/mukicik/home")

        return 
    }
    
    
    
    // const authorRefName = firestore.collection("Author").where("AuthorName", "==", bookAuthorName)
    // const authorDocName = await authorRefName.get()

    // const bpath = firestore.collection("Books")
    //     .where("bookAuthorName", "array-contains", "bookID")

    // const updateAuthor = firestore.collection("Author").doc(authorDocName).update({
    //     bookList : firebase.firestore.FieldValue.arrayUnion({
    //         path : bpath
    //     })
    // })
                
    res.status(500).json({ message: "Book denied!" });
});

// @desc    Update books
// @route   PUT /mukicik/library/:id/update
// @access  Private
const updateBook = asyncHandler(async (req, res) => {
    //mau pake body atau pake parameter?
    const {BookID, BookTitle, BookDescription, BookReleaseYear,BookGenre, 
        BookPageCount, BookPublisher,BookAuthorID, BookAuthorName} = req.body

    if (!req.body || req.body === null || typeof req.body === "undefined") {
        res.status(500);
        throw new Error('Something wrong with your input!');
    }

    let resUpd = await modelBook.updateBook(selectedDoc);

    if (resUpd === true) {
        res.status(200).json({ message: "Book added successfully!" });
        return
    }

    res.status(500).json({ message: "Book failed to add!" });

    // res.status(200).json({ message: `Update book ${req.params.id}` });
});

const deleteBook = asyncHandler(async (req, res) => {

    const selectedDoc = req.params.book;

    const result = {
        status: false,
        message: ""
    }

    if (selectedDoc === null || typeof selectedDoc === "undefined") {
        result.message = "WHAT ARE YOU DOING???"
        res.status(500).json(result.message);
    }
    
    let resDel =  await modelBook.deleteBook(selectedDoc);

    if (resDel === true) {
        // res.status(200).json({ message: "success delete" });
        res.redirect('/mukicik/home')
    }

    res.status(500).json({ message: "fail delete" });
});

const deleteAll = asyncHandler(async (req, res) =>{
    var del = await modelBook.deleteAllBook()
    res.redirect('/mukicik/home');
})

module.exports = { getBookDetail, getBookNew, getBook, setBook, updateBook, deleteBook, deleteAll};