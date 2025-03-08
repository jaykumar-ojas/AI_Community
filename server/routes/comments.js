const express = require('express');
const router = express.Router();
const Comment = require('../models/commentsModel');

// Comment Controller Functions
const addComment = (req, res) => {
    let data = {
        author: {
            id: req.body.id,
            name: req.body.name
        },
        commentText: req.body.commentText,
        postId: req.body.postId
    }
    if ('parentId' in req.body) {
        data.parentId = req.body.parentId
    }
    if ('depth' in req.body) {
        data.depth = req.body.depth
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
    Comment.updateOne({_id: comment.id}, {$set: {commentText: comment.commentText}})
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

        // If this is a parent comment, delete all its replies (comments with this parentId)
        Comment.deleteMany({ parentId: commentId })
        .exec()
        .then(() => {
            // Now delete the comment itself
            Comment.deleteOne({ _id: commentId })
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

// Routes
router.get('/', getComments);
router.post('/edit', updateComment);
router.post('/', addComment);
router.delete('/:id', deleteComment);

module.exports = router;