const { makeUploader } = require("../config/cloudinary");

const clubLogoUpload = makeUploader("club-logos");
const contactPhotoUpload = makeUploader("contact-photos");

module.exports = { clubLogoUpload, contactPhotoUpload };
