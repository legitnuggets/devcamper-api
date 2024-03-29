const path = require('path');
const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/asyncHandler');

exports.getBootcamps = asyncHandler(async (req, res) => {
    const bootcamps = await Bootcamp.find(req.query).populate('courses');

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps,
    });
});

exports.getBootcamp = asyncHandler(async (req, res) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return res.status(404).json({
            success: false,
            error: `Resource ${req.params.id} not found`,
        });
    }
    res.status(200).json({ success: true, data: bootcamp });
});

exports.createBootcamp = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    req.body.user = userId;

    const publishedBootcamp = await Bootcamp.findOne({ user: userId });
    if (publishedBootcamp) {
        return res.sendStatus(400);
    }

    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
        success: true,
        data: bootcamp,
    });
});

exports.updateBootcamp = asyncHandler(async (req, res) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (bootcamp.user.toString() !== req.user.id.toString()) {
        return res.sendStatus(401);
    }

    if (!bootcamp) {
        return res.status(400).json({
            success: false,
            error: `Resource ${req.params.id} not found`,
        });
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, req.body);

    res.status(200).json({ success: true });
});

exports.deleteBootcamp = asyncHandler(async (req, res) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (bootcamp.user.toString() !== req.user.id.toString()) {
        return res.sendStatus(401);
    }

    if (!bootcamp) {
        return res.status(400).json({
            success: false,
            error: `Resource ${req.params.id} not found`,
        });
    }

    bootcamp.remove();

    res.status(200).json({ success: true });
});

exports.uploadPhotoBootcamp = asyncHandler(async (req, res) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (bootcamp.user.toString() !== req.user.id.toString()) {
        return res.sendStatus(401);
    }

    if (!bootcamp) {
        return res.status(404).json({
            success: false,
            error: 'Bootcamp not found',
        });
    }
    if (!req.files?.photo) {
        return res.status(404).json({
            success: false,
            error: 'No photo found',
        });
    }

    const photo = req.files.photo;

    if (photo.size > process.env.MFILE_UPLOAD_MAX_SIZE) {
        res.status(400).json({
            success: false,
            error: `File size must be less than ${process.env.FILE_UPLOAD_MAX_SIZE}`,
        });
    }

    if (!photo.mimetype.startsWith('image')) {
        res.status(400).json({
            success: false,
            error: `File must be an image`,
        });
    }

    const newPhotoName = `bootcamp_${bootcamp.id}${path.parse(photo.name).ext}`;

    const movePath = path.join(
        __dirname,
        '..',
        process.env.FILE_UPLOAD_PATH,
        newPhotoName
    );

    photo.mv(movePath, function (err) {
        if (err) {
            return res.status(500);
        }
    });

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: newPhotoName });

    res.status(200).json({
        success: true,
    });
});
