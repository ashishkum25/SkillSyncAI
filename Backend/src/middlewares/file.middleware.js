const multer = require("multer")

//For uploading pdf files
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    }
})


module.exports = upload;