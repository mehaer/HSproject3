'use client'
import * as THREE from './three.js-master/build/three.module.js'
import { Box, Stack, TextField, Button } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { GLTFLoader } from './three.js-master/examples/jsm/loaders/GLTFLoader.js'
// import { OrbitControls } from './three.js-master/examples/jsm/controls/OrbitControls.js'


export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! Want ideas for coffee recipes or cute cafe suggestions? Ask away :)",
    },
  ])
  const [message, setMessage] = useState('')

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])

    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
        return reader.read().then(processText)
      })
    })
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f7c6e7');
    //load sparkle texture
    const textureLoader = new THREE.TextureLoader();
    const sparkleTexture = textureLoader.load('/sparkles.256x245.png');

    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.2,
      map: sparkleTexture,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      opacity: 1.0,
      // color: new THREE.Color(0xfaeeb4)
    });
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // if (!canvasRef.current) return

    // const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f7c6e7')

    const loader = new GLTFLoader()
    let model;
    loader.load(
      '/cloud_tea.glb',
      function (glb) {
        model = glb.scene
        model.scale.set(25, 25, 25)
        model.position.set(0, 0, 0)
        scene.add(model)
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + ' % loaded')
      },
      function (error) {
        console.error('An error occurred:', error)
      }
    )

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    )
    camera.position.set(0, 3, 5)
    camera.lookAt(0, 0, 0)
    scene.add(camera)

    const light = new THREE.DirectionalLight(0xffffff, 2)
    light.position.set(2, 2, 5)
    scene.add(light)

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.gammaOutput = true

    // Mouse hover rotation
    const mouseMoveHandler = (event) => {
      if (!model) return;

      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      model.rotation.y = mouseX * Math.PI; // Rotate horizontally based on mouse X position
      model.rotation.x = mouseY * Math.PI / 8; // Rotate slightly vertically based on mouse Y position
    };

    window.addEventListener('mousemove', mouseMoveHandler);

    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      sizes.width = window.innerWidth
      sizes.height = window.innerHeight
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()
      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', mouseMoveHandler);
      renderer.dispose()
    }
  }, [])

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="stretch"
      sx={{ boxSizing: 'border-box',
      overflow: 'hidden', 
      backgroundColor: '#f7c6e7', 
      
      }}
    >
      {/* Canvas element for Three.js */}
      <Box
        width="50vw"
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ boxSizing: 'border-box',
       
       }}
      >
        <canvas className="webgl" ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
      </Box>

      {/* Chat Box */}
      <Box
        width="40vw"
        height="90vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ boxSizing: 'border-box', overflow: 'hidden',
        }}
      >
        <Stack
          direction={'column'}
          width="100%"
          height="80%"
          p={4}
          spacing={3}
          sx={{
            backgroundColor: '#f7c6e7',
            borderRadius: 2,
            
          }}
        >
          <Stack
            direction={'column'}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
           
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === 'assistant' ? 'flex-start' : 'flex-end'
                }
                
              >
                <Box
                  bgcolor={
                    message.role === 'assistant'
                      ? '#b8027b'
                      : 'secondary.main'
                  }
                  color="white"
                  borderRadius={2}
                  p={3}
                >
                  {message.content}
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
          <Stack direction={'row'} spacing={2}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevents the default action of the Enter key (like submitting a form)
                  sendMessage();
                }
              }}
              sx={{
                backgroundColor: '#E4AEE8',
                borderRadius: 2, // Add border radius
                '& .MuiInputBase-root': {
                  border: 'none', // Remove the border
                  borderRadius: 2, // Add border radius to the input field
                  '&:hover': {
                    border: 'none', // Ensure no border on hover
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white', // Customize label color if needed
                  '&.Mui-focused': {
                    color: 'white', // Ensure label color remains white when focused
                  },
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2, // Add border radius to the outlined input variant
                  '& fieldset': {
                    border: 'none', // Remove the default border
                  },
                  '&:hover fieldset': {
                    border: 'none', // Ensure no border on hover
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none', // Ensure no border when focused
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#F3DEF5', // Set text color
                  '&:hover': {
                    color: '#F3DEF5', // Ensure text color remains the same on hover
                  },
                },
                '& .MuiOutlinedInput-root:hover .MuiInputLabel-root': {
                  color: 'white', // Change label color to pink on hover
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white', // Change the border color to pink on hover
                },
              }}
            />
            <Button variant="contained" onClick={sendMessage} sx={{ backgroundColor: '#b8027b', '&:hover': { backgroundColor: '#d81b60' } }}>
              Send
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
