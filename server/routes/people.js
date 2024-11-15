import express from "express";
import db from "../db/connection.js";
import { ObjectId } from "mongodb"; // Convert the id from string to ObjectId for the _id.

// Router for handling record-related routes is created here. 
const router = express.Router();

// Backend defines API endpoints at /record for CRUD operations (GET, GET by id, POST, PATCH, DELETE):
// Get a single record by id
router.get("/", async (req, res) => {
  try {
    const people = await Person.find({});
    res.status(200).json(people);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching people' });
  }
});

// Create a new record.
router.post("/", async (req, res) => {
  try {
    const { name, imageData } = req.body;
    
    const person = await Person.findOne({ name });
    
    if (person) {
      // Update existing person
      person.images.push(imageData);
      await person.save();
      res.status(200).json(person);
    } else {
      // Create new person
      const newPerson = new Person({
        name,
        images: [imageData]
      });
      await newPerson.save();
      res.status(201).json(newPerson);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error saving person data' });
  }
});

export default router; // Export the router
