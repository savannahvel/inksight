const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                 const userData = await User
                .findOne({_id: context.user._id })
                .populate('books')
                .select('-__v -password');

                return userData;
            }
            throw new AuthenticationError('You must be logged in!')
        },
    },

    Mutation: {
        addUser: async (parent, {username, email, password}) => {
            const user = await User.create({username, email, password});

            if (!username || !email || !password) {
                throw new Error('Please enter a username, email, and password');
            };

            const token = signToken(user);
            return { token, user }; 
        },
        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            };

            const correctPW =  await user.isCorrectPassword(password);

            if (!correctPW) {
                throw new AuthenticationError('Incorrect credentials');
            };

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: bookData }},
                    { new: true }
                )
                return user;
            }

            throw new AuthenticationError('You need to be logged in to save a book!')
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const user = await User.findOneAndDelete(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId }}},
                    { new: true }
                )

                return user;
            }

            throw new AuthenticationError('You need to be logged in to delete a book!')
        }


    }
}

module.exports = resolvers;