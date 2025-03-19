const express = require('express');
const router = express.Router();
const Comment = require('../models/commentsModel');
const multer = require('multer');

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept images, videos, and audio files
        if (
            file.mimetype.startsWith('image/') || 
            file.mimetype.startsWith('video/') || 
            file.mimetype.startsWith('audio/')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Only images, videos, and audio files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

// Import AWS middleware for file uploads
const { awsuploadMiddleware, generateSignedUrl, awsdeleteMiddleware } = require('../middleware/awsmiddleware');

// Comment Controller Functions
const addComment = (req, res) => {
    let data = {
        author: {
            id: req.body.id,
            name: req.body.name
        },
        commentText: req.body.commentText,
        postId: req.body.postId,
        likes: [], // Initialize empty arrays for likes and dislikes
        dislikes: []
    }
    if ('parentId' in req.body) {
        data.parentId = req.body.parentId
    }
    if ('depth' in req.body) {
        data.depth = req.body.depth
    }
    
    // Handle media attachments if any
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        data.mediaAttachments = req.uploadedFiles;
    }
    
    const comment = new Comment(data);
    comment.save()
    .then(comment => res.json({
        comment: comment
    }))
    .catch(err => res.status(500).json({error: err}))
}

const updateComment = (req, res) => {
    let comment = req.body;
    Comment.updateOne(
        {_id: comment.id}, 
        {
            $set: {
                commentText: comment.commentText,
                mediaAttachments: comment.mediaAttachments || []
            }
        }
    )
    .exec()
    .then(result => res.status(200).json({
        message: "Comment Updated",
        comment: comment
    }))
    .catch(err => res.status(500).json({error: err}))
}

const deleteComment = (req, res) => {
    const commentId = req.params.id;
    const userId = req.body.userId;

    // First find the comment to check ownership
    Comment.findById(commentId)
    .exec()
    .then(comment => {
        if (!comment) {
            return res.status(404).json({
                error: "Comment not found"
            });
        }

        // Check if the user is the author of the comment
        if (comment.author.id.toString() !== userId) {
            return res.status(403).json({
                error: "Not authorized to delete this comment"
            });
        }

        // Delete media attachments from S3 if any
        if (comment.mediaAttachments && comment.mediaAttachments.length > 0) {
            const deletePromises = comment.mediaAttachments.map(attachment => 
                awsdeleteMiddleware(attachment.fileName)
            );
            return Promise.all(deletePromises)
                .then(() => comment);
        }
        return comment;
    })
    .then(comment => {
        // If this is a parent comment, delete all its replies (comments with this parentId)
        return Comment.deleteMany({ parentId: commentId })
            .exec()
            .then(() => {
                // Now delete the comment itself
                return Comment.deleteOne({ _id: commentId })
                    .exec()
                    .then(() => {
                        res.status(200).json({
                            message: "Comment and its replies deleted successfully"
                        });
                    })
                    .catch(err => res.status(500).json({error: err}));
            })
            .catch(err => res.status(500).json({error: err}));
    })
    .catch(err => res.status(500).json({error: err}));
}

const getComments = (req, res) => {
    const postId = req.query.postId;
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required' });
    }

    Comment.find({postId: postId}).sort({postedDate: 1}).lean().exec()
    .then(comments => {
        let rec = (comment, threads) => {
            for (var thread in threads) {
                value = threads[thread];

                if (thread.toString() === comment.parentId.toString()) {
                    value.children[comment._id] = comment;
                    return;
                }

                if (value.children) {
                    rec(comment, value.children)
                }
            }
        }
        let threads = {}, comment
        for (let i=0; i<comments.length; i++) {
            comment = comments[i]
            comment['children'] = {}
            let parentId = comment.parentId
            if (!parentId) {
                threads[comment._id] = comment
                continue
            }
            rec(comment, threads)
        }
        res.json({
            'count': comments.length,
            'comments': threads
        })
    })
    .catch(err => res.status(500).json({error: err}))
}

// New function to handle liking a comment
const likeComment = (req, res) => {
    const commentId = req.params.id;
    const userId = req.body.userId;

    Comment.findById(commentId)
    .exec()
    .then(comment => {
        if (!comment) {
            return res.status(404).json({
                error: "Comment not found"
            });
        }

        // Check if user already liked this comment
        const alreadyLiked = comment.likes.includes(userId);
        // Check if user already disliked this comment
        const alreadyDisliked = comment.dislikes.includes(userId);

        // If already liked, remove the like (toggle)
        if (alreadyLiked) {
            Comment.updateOne(
                { _id: commentId },
                { $pull: { likes: userId } }
            )
            .exec()
            .then(() => {
                res.status(200).json({
                    message: "Like removed successfully"
                });
            })
            .catch(err => res.status(500).json({error: err}));
        } 
        // If not liked, add like and remove dislike if exists
        else {
            let updateOperation = { $addToSet: { likes: userId } };
            
            // If already disliked, remove the dislike
            if (alreadyDisliked) {
                updateOperation.$pull = { dislikes: userId };
            }
            
            Comment.updateOne(
                { _id: commentId },
                updateOperation
            )
            .exec()
            .then(() => {
                res.status(200).json({
                    message: "Comment liked successfully"
                });
            })
            .catch(err => res.status(500).json({error: err}));
        }
    })
    .catch(err => res.status(500).json({error: err}));
}

// New function to handle disliking a comment
const dislikeComment = (req, res) => {
    const commentId = req.params.id;
    const userId = req.body.userId;

    Comment.findById(commentId)
    .exec()
    .then(comment => {
        if (!comment) {
            return res.status(404).json({
                error: "Comment not found"
            });
        }

        // Check if user already disliked this comment
        const alreadyDisliked = comment.dislikes.includes(userId);
        // Check if user already liked this comment
        const alreadyLiked = comment.likes.includes(userId);

        // If already disliked, remove the dislike (toggle)
        if (alreadyDisliked) {
            Comment.updateOne(
                { _id: commentId },
                { $pull: { dislikes: userId } }
            )
            .exec()
            .then(() => {
                res.status(200).json({
                    message: "Dislike removed successfully"
                });
            })
            .catch(err => res.status(500).json({error: err}));
        } 
        // If not disliked, add dislike and remove like if exists
        else {
            let updateOperation = { $addToSet: { dislikes: userId } };
            
            // If already liked, remove the like
            if (alreadyLiked) {
                updateOperation.$pull = { likes: userId };
            }
            
            Comment.updateOne(
                { _id: commentId },
                updateOperation
            )
            .exec()
            .then(() => {
                res.status(200).json({
                    message: "Comment disliked successfully"
                });
            })
            .catch(err => res.status(500).json({error: err}));
        }
    })
    .catch(err => res.status(500).json({error: err}));
}

// Routes
router.get('/', getComments);
router.post('/edit', updateComment);
router.post('/', upload.array('media', 5), awsuploadMiddleware, addComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', likeComment);
router.post('/:id/dislike', dislikeComment);

module.exports = router;