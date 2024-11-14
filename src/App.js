import React, { useEffect } from "react";
import * as faceapi from "face-api.js";
import "./App.css";

function App() {
  const startCamera = async () => {
    const video = document.getElementById("video");
  
    try {
      // Get all video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Choose the external webcam (for example, the second device in the list)
      console.log(videoDevices.length);
      const externalWebcam = videoDevices[0];  // Adjust this based on the index of your external webcam
      console.log(JSON.stringify(externalWebcam));
      // Get user media from the selected device
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: externalWebcam.deviceId },
      });
      
      video.srcObject = stream;
    } catch (err) {
      console.log("Error accessing the camera: ", err);
    }
  };
  
  

  useEffect(() => {
    const fetchModels = async () => {
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]).then(startCamera());
    };

    fetchModels();
    const video = document.getElementById("video");

    video.addEventListener("play", () => {
      const canvas = faceapi.createCanvasFromMedia(video);
      document.body.append(canvas);
      const boxSize = {
        width: video.width,
        height: video.height,
      };

      faceapi.matchDimensions(canvas, boxSize);

      setInterval(async () => {
        //async
        // await
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        const resizedDetections = faceapi.resizeResults(detections, boxSize);

        faceapi.draw.drawDetections(canvas, resizedDetections);

        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        // console.log(detections);
      }, 200);
    });
  }, []);
  
  return (
    <div className="App">
      <header className="App-header">
        <video id="video" width="720" height="540" autoPlay muted></video>
      </header>
    </div>
  );
}

export default App;
