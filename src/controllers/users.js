require('dotenv').config()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const model = require('../models/users');
const { SECRET_KEY } = process.env;

const register = async (req, res) => {
    const { firstName, lastName, password, email } = req.body;

    // Check if all required fields are present
    if (!firstName || !password || !email) {
        return res.status(400).json({ message: "Missing required field(s)!" })
    }

    try {
        // Existing user check
        const existingUser = await model.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists!' });
        }

        // Password hashing 
        const hashedPassword = await bcrypt.hash(password, 8) // 8 is the number of rounds (AKA salt), the algorithm will use to hash the password

        // User creation
        const newUser = await model.create({
            email,
            firstName,
            lastName: lastName || '',
            password: hashedPassword,
        })

        console.log(newUser);

        // User token generation
        const token = jwt.sign({
            email: newUser.email,
            name: newUser.lastName ? newUser.firstName + " " + newUser.lastName : newUser.firstName,
            id: newUser._id
        }, SECRET_KEY) // This will generate a token whick contains a payload (email and id) and a secret key

        res.status(201).json({ token })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Oops! something went wrong." })
    }

}

const login = async (req, res) => {
    const { email, password } = req.body;

    // Check if all required fields are present
    if (!email || !password) {
        return res.status(400).json({ message: "Missing required field(s)!" })
    }

    try {
        // Existing user check
        const existingUser = await model.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: 'No registered user found with this email!' });
        }

        // Valid password check
        const validPassword = await bcrypt.compare(password, existingUser.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Incorrect password!' });
        }

        console.log(validPassword, `password is valid!`);

        // User token generation
        const token = jwt.sign({
            email: existingUser.email,
            name: existingUser.lastName ? existingUser.firstName + " " + existingUser.lastName : existingUser.firstName,
            id: existingUser._id
        }, SECRET_KEY) // Same as in register

        console.log(token);

        res.status(200).json({ token })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Oops! something went wrong" })
    }
}

const profile = async (req, res) => {
    try {
        // Existing user check
        const user = await model.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        const response = {
            name: user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName,
            email: user.email,
            id: user._id
        }
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Oops! something went wrong" })
    }
}

module.exports = { register, login, profile };