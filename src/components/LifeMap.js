import React, { useState, useEffect, useRef } from 'react';
import '../styles/LifeMap.css';

const LifeMap = () => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [tooltipText, setTooltipText] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const svgRef = useRef(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const starsRef = useRef(null);
  // Track pinch gesture for mobile zoom
  const [pinchStart, setPinchStart] = useState(0);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const categories = [
    { id: 'education', label: 'Education', color: '#4A90E2' },
    { id: 'work', label: 'Work Experience', color: '#50E3C2' },
    { id: 'hobbies', label: 'Hobbies', color: '#F5A623' },
    { id: 'dreams', label: 'Dreams', color: '#E74C3C' },
    { id: 'family', label: 'Family', color: '#9B59B6' }
  ];

  // Check if device is mobile on component mount
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      setIsMobileDevice(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Generate animated stars for the background
  const generateStars = () => {
    const starCount = 200;
    const stars = [];
    
    for (let i = 0; i < starCount; i++) {
      const size = Math.random() * 2 + 1;
      stars.push({
        id: `star-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        opacity: Math.random() * 0.7 + 0.3,
        animationDuration: Math.random() * 15 + 10,
        animationDelay: Math.random() * 10
      });
    }
    
    return stars;
  };
  
  const [stars] = useState(generateStars());

  // Check for saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('lifeMapData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.nodes && parsedData.nodes.length > 0 && 
            parsedData.connections && parsedData.connections.length > 0) {
          setNodes(parsedData.nodes);
          setConnections(parsedData.connections);
          setShowNameInput(false);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  const addMainNode = (name) => {
    const centerX = svgRef.current ? svgRef.current.clientWidth / 2 : window.innerWidth / 2;
    const centerY = svgRef.current ? svgRef.current.clientHeight / 2 : window.innerHeight / 2;
    
    const mainNode = {
      id: 'main',
      label: name,
      x: centerX,
      y: centerY,
      type: 'main',
      color: '#FFFFFF'
    };
    
    const categoryNodes = categories.map((category, index) => {
      const angle = (index * 2 * Math.PI) / categories.length;
      const distance = 150;
      return {
        id: category.id,
        label: category.label,
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
        type: 'category',
        color: category.color
      };
    });
    
    const categoryConnections = categories.map(category => ({
      from: 'main',
      to: category.id,
      color: category.color
    }));
    
    setNodes([mainNode, ...categoryNodes]);
    setConnections(categoryConnections);
    setShowNameInput(false);
  };

  const addChildNode = (parentId) => {
    const parent = nodes.find(node => node.id === parentId);
    if (!parent) return;
    
    const newId = `node_${Date.now()}`;
    const parentCategory = categories.find(c => c.id === parentId);
    const nodeColor = parentCategory ? parentCategory.color : parent.color;
    
    // Calculate position – random offset from parent
    const angle = Math.random() * 2 * Math.PI;
    const distance = 100;
    const newNode = {
      id: newId,
      label: 'New Node',
      x: parent.x + distance * Math.cos(angle),
      y: parent.y + distance * Math.sin(angle),
      type: 'subnode',
      color: nodeColor,
      editable: true
    };
    
    const newConnection = {
      from: parentId,
      to: newId,
      color: nodeColor
    };
    
    setNodes([...nodes, newNode]);
    setConnections([...connections, newConnection]);
    setSelectedNode(newId);
  };

  const startConnection = (nodeId) => {
    if (selectedNode && selectedNode !== nodeId) {
      const startNode = nodes.find(n => n.id === selectedNode);
      const endNode = nodes.find(n => n.id === nodeId);
      
      if (startNode && endNode) {
        const newConnection = {
          from: selectedNode,
          to: nodeId,
          color: startNode.color
        };
        
        // Check if connection already exists
        const connectionExists = connections.some(
          conn => (conn.from === selectedNode && conn.to === nodeId) || 
                 (conn.from === nodeId && conn.to === selectedNode)
        );
        
        if (!connectionExists) {
          setConnections([...connections, newConnection]);
          showNotification('Connected!');
        } else {
          showNotification('Connection already exists');
        }
      }
    }
  };

  const showNotification = (text) => {
    setTooltipText(text);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  const handleNodeClick = (nodeId, e) => {
    // Prevent event from propagating to the canvas
    if (e) e.stopPropagation();
    
    if (connectMode) {
      if (selectedNode && selectedNode !== nodeId) {
        startConnection(nodeId);
        setConnectMode(false);
      }
      setSelectedNode(nodeId);
    } else {
      setSelectedNode(nodeId === selectedNode ? null : nodeId);
    }
  };

  const handleNodeDoubleClick = (node, e) => {
    if (e) e.stopPropagation();
    const updatedNodes = nodes.map(n => {
      if (n.id === node.id) {
        return { ...n, editable: true };
      }
      return n;
    });
    setNodes(updatedNodes);
  };

  const updateNodeLabel = (nodeId, newLabel) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, label: newLabel, editable: false };
      }
      return node;
    });
    setNodes(updatedNodes);
  };

  // New method to delete a node
  const deleteNode = () => {
    if (!selectedNode) return;

    // Remove the selected node
    const updatedNodes = nodes.filter(node => node.id !== selectedNode);

    // Remove all connections involving the selected node
    const updatedConnections = connections.filter(
      conn => conn.from !== selectedNode && conn.to !== selectedNode
    );

    setNodes(updatedNodes);
    setConnections(updatedConnections);
    setSelectedNode(null);
    showNotification('Node deleted!');
  };

  // Extract clientX/clientY whether from mouse or touch events
  const getClientCoordinates = (e) => {
    if (e.touches) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handleDragStart = (e, nodeId) => {
    e.stopPropagation();
    const { clientX, clientY } = getClientCoordinates(e);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    setDraggedNode(nodeId);
    setDragOffset({
      x: node.x - (clientX - svgRect.left) / zoomLevel + viewPosition.x,
      y: node.y - (clientY - svgRect.top) / zoomLevel + viewPosition.y
    });
  };

  const handleDragMove = (e) => {
    if (!draggedNode) return;
    const { clientX, clientY } = getClientCoordinates(e);
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = (clientX - svgRect.left) / zoomLevel - viewPosition.x + dragOffset.x;
    const y = (clientY - svgRect.top) / zoomLevel - viewPosition.y + dragOffset.y;
    
    const updatedNodes = nodes.map(node => {
      if (node.id === draggedNode) {
        return { ...node, x, y };
      }
      return node;
    });
    
    setNodes(updatedNodes);
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  const handleCanvasDragStart = (e) => {
    if (draggedNode) return;
    const { clientX, clientY } = getClientCoordinates(e);
    setIsDraggingCanvas(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleCanvasDragMove = (e) => {
    if (!isDraggingCanvas) return;
    const { clientX, clientY } = getClientCoordinates(e);
    const dx = (clientX - dragStart.x) / zoomLevel;
    const dy = (clientY - dragStart.y) / zoomLevel;
    
    setViewPosition({
      x: viewPosition.x - dx,
      y: viewPosition.y - dy
    });
    
    setDragStart({ x: clientX, y: clientY });
  };

  const handleCanvasDragEnd = () => {
    setIsDraggingCanvas(false);
  };

  // Enhanced zoom function that works with mouse wheel and touch pinch
  const handleZoom = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  // Handle touch pinch start
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Calculate distance between two fingers
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStart(distance);
      e.preventDefault();
    } else if (e.touches.length === 1) {
      handleCanvasDragStart(e);
    }
  };

  // Handle touch move for pinch zoom
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      // Calculate current distance
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (pinchStart > 0) {
        // Calculate zoom change
        const delta = (distance - pinchStart) * 0.01;
        const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
        setZoomLevel(newZoom);
        setPinchStart(distance);
      }
    } else if (e.touches.length === 1 && isDraggingCanvas) {
      handleCanvasDragMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    setPinchStart(0);
    if (isDraggingCanvas) {
      handleCanvasDragEnd();
    }
  };

  const saveLifeMap = () => {
    try {
      const data = { nodes, connections };
      const json = JSON.stringify(data);
      // Save to localStorage for persistence
      localStorage.setItem('lifeMapData', json);
      
      // Create a downloadable file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'personal-mind-map.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification('Mind map saved!');
    } catch (err) {
      console.error('Error saving mind map:', err);
      showNotification('Error saving mind map');
    }
  };

  const loadLifeMap = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.nodes && data.connections) {
          setNodes(data.nodes);
          setConnections(data.connections);
          setShowNameInput(false);
          showNotification('Mind map loaded!');
        }
      } catch (error) {
        console.error('Error loading mind map:', error);
        showNotification('Error loading file!');
      }
    };
    reader.readAsText(file);
  };

  // Clear canvas and start over
  const clearLifeMap = () => {
    if (window.confirm('Are you sure you want to clear the mind map and start over?')) {
      setNodes([]);
      setConnections([]);
      setSelectedNode(null);
      setShowNameInput(true);
      localStorage.removeItem('lifeMapData');
      showNotification('Mind map cleared!');
    }
  };

  // Zoom controls for mobile
  const zoomIn = () => {
    const newZoom = Math.min(2, zoomLevel + 0.1);
    setZoomLevel(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(0.5, zoomLevel - 0.1);
    setZoomLevel(newZoom);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setViewPosition({ x: 0, y: 0 });
  };

  // Auto-save changes to localStorage
  useEffect(() => {
    if (nodes.length > 0) {
      localStorage.setItem('lifeMapData', JSON.stringify({ nodes, connections }));
    }
  }, [nodes, connections]);

  // Global mouse and touch event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggedNode) {
        handleDragMove(e);
      } else if (isDraggingCanvas) {
        handleCanvasDragMove(e);
      }
    };
    
    const handleMouseUp = () => {
      if (draggedNode) handleDragEnd();
      if (isDraggingCanvas) handleCanvasDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedNode, isDraggingCanvas, dragStart, viewPosition, zoomLevel]);

  return (
    <div className="mind-map-container">
      {/* Animated Stars Background */}
      <div className="stars-background" ref={starsRef}>
        {stars.map((star) => (
          <div 
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle ${star.animationDuration}s infinite ${star.animationDelay}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Top Bar */}
      <div className="top-bar">
        <h1>LifeMap</h1>
        <div className="button-group">
          <button 
            className={`btn ${connectMode ? 'btn-active' : ''}`}
            onClick={() => setConnectMode(!connectMode)}
          >
            {connectMode ? 'Cancel Connect' : 'Connect Mode'}
          </button>
          
          <button 
            className="btn"
            onClick={saveLifeMap}
          >
            Save
          </button>
          
          <label className="btn btn-file">
            Load
            <input 
              type="file" 
              accept=".json" 
              onChange={loadLifeMap}
            />
          </label>

          {!showNameInput && (
            <button 
              className="btn btn-danger"
              onClick={clearLifeMap}
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      {/* Main Canvas */}
      <div 
        className="canvas"
        onWheel={handleZoom}
        onMouseDown={handleCanvasDragStart}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showNameInput && (
          <div className="name-input-overlay">
            <div className="name-input-box">
              <div className="space-title">
                <div className="planet"></div>
                <h2>Map Out your Life Digitally</h2>
              </div>
              <p className="cosmic-subtitle">An Open-Source way to keep track of Life's Questions</p>
              
              <div className="input-field">
                <input
                  type="text"
                  placeholder="Enter your name, traveler"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addMainNode(nameInput || 'Me');
                    }
                  }}
                />
              </div>
              
              <button
                className="cosmic-button"
                onClick={() => addMainNode(nameInput || 'Me')}
              >
                <span className="button-text">Launch Concept Map</span>
                <div className="button-stars">
                  <div className="star-1"></div>
                  <div className="star-2"></div>
                  <div className="star-3"></div>
                </div>
              </button>
            </div>
          </div>
        )}
        
        <svg 
          ref={svgRef}
          className="mind-map-svg"
        >
          <g transform={`scale(${zoomLevel}) translate(${-viewPosition.x}, ${-viewPosition.y})`}>
            {/* Connections */}
            {connections.map((connection, index) => {
              const fromNode = nodes.find(node => node.id === connection.from);
              const toNode = nodes.find(node => node.id === connection.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={`connection-${index}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={connection.color}
                  strokeWidth={2}
                  strokeOpacity={0.7}
                />
              );
            })}
            
            {/* Nodes */}
            {nodes.map((node) => {
              const nodeSize = node.type === 'main' ? 80 : node.type === 'category' ? 60 : 50;
              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="node"
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  onMouseDown={(e) => handleDragStart(e, node.id)}
                  onTouchStart={(e) => handleDragStart(e, node.id)}
                >
                  {selectedNode === node.id && (
                    <circle
                      r={nodeSize / 2 + 10}
                      fill="transparent"
                      stroke={node.color}
                      strokeWidth={1}
                      strokeDasharray="3,3"
                      className="connection-hook"
                    />
                  )}
                  
                  <circle
                    r={nodeSize / 2}
                    fill="rgba(0,0,0,0.5)"
                    stroke={node.color}
                    strokeWidth={selectedNode === node.id ? 3 : 1}
                    className="node-circle"
                  />
                  
                  {node.editable ? (
                    <foreignObject
                      x={-nodeSize / 2 - 20}
                      y={-nodeSize / 2}
                      width={nodeSize + 40}
                      height={nodeSize}
                      className="edit-container"
                    >
                      <input
                        type="text"
                        defaultValue={node.label}
                        className="node-edit-input"
                        autoFocus
                        onBlur={(e) => updateNodeLabel(node.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateNodeLabel(node.id, e.target.value);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize={node.type === 'main' ? 16 : 12}
                      fontWeight={node.type === 'main' ? 'bold' : 'normal'}
                    >
                      {node.label.length > 12 ? node.label.substring(0, 10) + '...' : node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        
        {/* Mobile zoom controls */}
        {isMobileDevice && (
          <div className="mobile-controls">
            <button onClick={zoomIn} className="zoom-btn">+</button>
            <button onClick={resetZoom} className="zoom-btn">↻</button>
            <button onClick={zoomOut} className="zoom-btn">-</button>
          </div>
        )}
      </div>
      
      {/* Action Panel - Fixed for Mobile */}
      {selectedNode && (
        <div className="action-panel mobile-friendly-panel">
          <h3>
            {nodes.find(n => n.id === selectedNode)?.label || 'Selected Node'}
          </h3>
          <div className="button-group">
            <button
              className="btn"
              onClick={() => addChildNode(selectedNode)}
            >
              Add Child
            </button>
            <button
              className="btn"
              onClick={() => handleNodeDoubleClick(nodes.find(n => n.id === selectedNode))}
            >
              Edit
            </button>
            <button
              className="btn btn-danger"
              onClick={deleteNode}
            >
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="tooltip">
          {tooltipText}
        </div>
      )}
      
      {/* Help Panel */}
      <div className="help-panel mobile-friendly-panel">
        {isMobileDevice ? (
          <>
            <p>👆 <strong>Tap</strong>: Select Node</p>
            <p>✌️ <strong>Pinch</strong>: Zoom In/Out</p>
            <p>👆👆 <strong>Double Tap</strong>: Edit Node</p>
            <p>✋ <strong>Drag</strong>: Move Canvas/Nodes</p>
          </>
        ) : (
          <>
            <p>🖱️ <strong>Scroll</strong>: Zoom In/Out</p>
            <p>✋ <strong>Drag</strong>: Move Canvas/Nodes</p>
            <p>🔄 <strong>Double-click</strong>: Edit Node</p>
            <p>⚡ <strong>Tap+Tap</strong>: Connect Nodes</p>
          </>
        )}
      </div>

      <footer className="footer">
        Made with <span style={{ color: 'red' }}>❤</span> by Kuber Mehta
      </footer>
    </div>
  );
};

export default LifeMap;
