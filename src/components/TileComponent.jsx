import React from "react";
import { Link } from "react-router-dom";
import "./TileComponent.css";

const TileComponent = () => {
  return (
    <div className="tile-container">
      <Link to="/live-mood-detection" className="tile">
        Tile 1: Live Mood Detection
      </Link>
      <Link to="/face-recognition" className="tile">
        Tile 2: Face Recognition
      </Link>
    </div>
  );
};

export default TileComponent;
