const admin = require("firebase-admin");
const firestore = admin.firestore();
const modelAuthor = require("../model/author");
const asyncHandler = require('express-async-handler');
const authorRef = firestore.collection("Author")
const bookRef = firestore.collection("Books")

// @desc    Get goals
// @route   GET /mukicik/library
// @access  Private
const getAuthor = asyncHandler(async (req, res) => {

    authorRef.get().then(snapshot => {
        const author_list = snapshot.docs.map(doc => Object.assign(doc.data(), { documentId: snapshot.id }));
        console.log(author_list)
        res.render("listofAuthor.html", { author_list: author_list })
    });

});

const getAuthorBook = asyncHandler(async (req, res) => {

    const selectedDoc = req.params.author;

    console.log(selectedDoc)

    // var authordata = await bookRef.doc(selectedDoc).get().then(queryResult => {
    //     console.log(queryResult)
    //     return queryResult.data()
    // });

    // console.log(authordata)
    // let book_list_data = []
    // console.log(authordata.bookList.length);
    // // console.log(author_data.bookList.size);
    // for (let i = 0; i < authordata.bookList.length; i++){
    //     await authordata.bookList[i].bpath.get().then(snap => {
    //         book_list_data.push(snap.data())
    //     })
        
    //     // return book_list_data
    // }

    // console.log(book_list_data)

    // res.render("listBookBasedAuthor.html", { book_list_data: book_list_data, author_data: author_data })

    var snapAuthor = await authorRef.doc(selectedDoc).get()
    // console.log(snapAuthor)
    var getAuthorData = snapAuthor.data()

    // console.log(getAuthorData)
    // console.log(getAuthorData.bookList.length)

    var book_list_data = []

    for (let i = 0; i < getAuthorData.bookList.length; i++){
        await getAuthorData.bookList[i].bpath.get().then(snap => {
            book_list_data.push(snap.data())
        })
        
    //     // return book_list_data
    }
    
    
    // for (let i = 0; i < book_list_data.length; i++) {
    //     const dataBook = book_list_data[i]
    //     const getRefAuthor = await dataBook.bookAuthorRef.get()
    //     // console.log(getRefAuthor)
    //     const dataRefAuth = getRefAuthor.data()
    //     if (getRefAuthor.exists) {
    //         book_list_data[i].bookID = dataRefAuth.bookID
    //         book_list_data[i].bookTitle = dataRefAuth.bookTitle
    //         book_list_data[i].bookDescription = dataRefAuth.bookDescription
    //         book_list_data[i].bookGenre = dataRefAuth.bookGenre
    //     }
    // }
    
    res.render("listBookBasedAuthor.html", { book_list_data: book_list_data, getAuthorData: getAuthorData })
    
    // console.log(book_list_data)


    

})

// @desc    Set goal
// @route   POST /mukicik/library
// @access  Private
const setAuthor = asyncHandler(async (req, res) => {

    const {AuthorName, AuthorEmail, AuthorCountry, AuthorAddress} = req.body

    if (!req.body || req.body === null || typeof req.body === "undefined") {
        res.status(500);
        throw new Error('Something wrong with your input!');
    }

    const authorRefName = authorRef.where("AuthorName", "==", AuthorName)
    const authorDocName = await authorRefName.get()

    if(authorDocName.empty){

        const resRegister = await modelAuthor.registerAuthor(AuthorName, AuthorEmail, AuthorCountry, AuthorAddress);

        if (resRegister === true) {
            res.status(200).json({ message: "Author added successfully!" });
            return
        }
        else {
            res.status(500).json({ message: "Author failed to add!" });
        }

    }

    res.status(500).json({ message: "Author failed to add!" });
});

// @desc    Update books
// @route   PUT /mukicik/library/:id/update
// @access  Private
const updateAuthor = asyncHandler(async (req, res) => {
    
    const authorRefName = bookRef.where("bookAuthorName", "==", AuthorName)
    const authorDocName = await authorRefName.get()

    let resUpd = await modelBook.updateAuthor(authorDocName);

    if (resUpd === true) {
        res.status(200).json({ message: "Author updated!" });
        return
    }

    res.status(500).json({ message: "fail to update author!" });
});


module.exports = {getAuthor, setAuthor, updateAuthor, getAuthorBook};