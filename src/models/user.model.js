import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
   
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    
   
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    profilePicture: {
        type: String,
        default: null
    },
    
    
    isActive: {
        type: Boolean,
        default: true
    },
    
   
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
    return this.findOne({ firebaseUid });
};

userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

export default User;