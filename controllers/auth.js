const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const dotenv = require('dotenv');

dotenv.config({ path: '../config/config.env' });

exports.registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    await User.create({ name, email, password, role });

    res.status(200).json({
        success: true,
    });
});

exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email }).select('email password');
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
        const token = user.getSignedJWT();
        const options = {
            expires: new Date(
                Date.now() + process.env.JWT_COOKIE_EXPIRE * 1000 * 60 * 60 * 24
            ),
            httpOnly: true,
        };

        if (process.env.mode === 'prod') {
            options.secure = true;
        }

        return res.status(200).cookie('token', token, options).json({
            success: true,
            token,
        });
    }

    res.sendStatus(401);
});

exports.whoAmi = asyncHandler(async function (req, res, next) {
    const user = await User.findById(req.user.id);

    return res.status(200).json({
        success: true,
        user,
    });
});
