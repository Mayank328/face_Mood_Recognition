import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TileComponent from "./TileComponent";
import Live_mood_detection  from "./Live_mood_detection";
import FaceRecognition from "./FaceRecognition";
import './start_page.css';


function Start_page(){
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TileComponent />} />
        <Route path="/live-mood-detection" element={<Live_mood_detection />} />
        <Route path="/face-recognition" element={<FaceRecognition />} />
      </Routes>
    </Router>
  );
};

export default Start_page;
