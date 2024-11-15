import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

function FaceRecognition() {
  const [image, setImage] = useState(null);
  const [mood, setMood] = useState("");
  const [personName, setPersonName] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [peopleData, setPeopleData] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    loadModels();
    // Load stored people data from localStorage
    const storedData = localStorage.getItem('peopleData');
    if (storedData) {
      setPeopleData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('peopleData', JSON.stringify(peopleData));
  }, [peopleData]);

  const loadModels = async () => {
    try {
      setLoadingError(null);
      console.log('Loading models...');
      
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('Models loaded successfully');
      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading models:', error);
      setLoadingError('Failed to load face detection models.');
    }
  };

  // Function to find matching person based on face descriptor
  const findMatchingPerson = (descriptor) => {
    const threshold = 0.6; // Adjust this threshold as needed
    
    for (const person of Object.values(peopleData)) {
      if (person.descriptor) {
        const distance = faceapi.euclideanDistance(
          new Float32Array(person.descriptor), 
          descriptor
        );
        if (distance < threshold) {
          return person.name;
        }
      }
    }
    return null;
  };

  const updatePersonData = (name, imageUrl, detectedMood, descriptor) => {
    setPeopleData(prevData => {
      const personData = prevData[name] || {
        name,
        images: [],
        moods: [],
        descriptor: descriptor ? Array.from(descriptor) : null,
        timestamps: []
      };

      return {
        ...prevData,
        [name]: {
          ...personData,
          images: [...personData.images, imageUrl],
          moods: [...personData.moods, detectedMood],
          timestamps: [...personData.timestamps, new Date().toISOString()],
          // Only update descriptor if it's a new person
          descriptor: personData.descriptor || (descriptor ? Array.from(descriptor) : null)
        }
      };
    });
  };

  const analyzeImage = async (imageUrl, file) => {
    try {
      const img = await faceapi.fetchImage(imageUrl);
      
      const detection = await faceapi.detectSingleFace(
        img, 
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptor();

      if (detection) {
        // Get mood
        const dominantMood = Object.entries(detection.expressions)
          .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        
        setMood(dominantMood);

        // Create permanent URL for image storage
        const permanentImageUrl = await storeImage(file);

        // Check if person already exists
        const matchingPerson = findMatchingPerson(detection.descriptor);

        let name;
        if (matchingPerson) {
          name = matchingPerson;
          console.log(`Recognized person: ${name}`);
        } else {
          name = prompt('New face detected! Please enter person name:');
          if (!name) return; // Exit if no name provided
        }

        updatePersonData(name, permanentImageUrl, dominantMood, detection.descriptor);
        setPersonName(name);
        setSelectedPerson(name);
      } else {
        alert('No face detected in the image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Error analyzing image. Please try another image.');
    }
  };

  const handleImageUpload = async (event) => {
    if (!modelsLoaded) {
      alert('Please wait for models to load');
      return;
    }

    const file = event.target.files[0];
    if (file) {
      try {
        const imageUrl = URL.createObjectURL(file);
        setImage(imageUrl);
        await analyzeImage(imageUrl, file);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try another image.');
      }
    }
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getPieChartData = (name) => {
    if (!peopleData[name]) return [];
    
    const moodCounts = peopleData[name].moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(moodCounts).map(([mood, count]) => ({
      name: mood,
      value: count
    }));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Face Recognition & Mood Detection</h1>
      
      {loadingError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {loadingError}
        </div>
      )}

      {!modelsLoaded && !loadingError && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Loading face detection models...
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={!modelsLoaded}
          className="mb-4"
        />

        <select 
          value={selectedPerson || ''} 
          onChange={(e) => setSelectedPerson(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Select Person</option>
          {Object.keys(peopleData).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {selectedPerson && peopleData[selectedPerson] && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedPerson}'s Image History
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {peopleData[selectedPerson].images.map((img, index) => (
                <div key={index} className="relative">
                  <img 
                    src={img} 
                    alt={`${selectedPerson} - ${index}`} 
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white p-1 text-sm">
                    <div>{peopleData[selectedPerson].moods[index]}</div>
                    <div>{new Date(peopleData[selectedPerson].timestamps[index]).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Mood Distribution</h2>
            <PieChart width={300} height={300}>
              <Pie
                data={getPieChartData(selectedPerson)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {getPieChartData(selectedPerson).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={MOOD_COLORS[entry.name] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
      )}
    </div>
  );
}

const MOOD_COLORS = {
  happy: "#FFD700",
  sad: "#6495ED",
  angry: "#FF6347",
  surprised: "#FFA500",
  neutral: "#90EE90",
  fearful: "#DDA0DD",
  disgusted: "#A0522D"
};

export default FaceRecognition;