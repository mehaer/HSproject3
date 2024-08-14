'use client'
import * as THREE from './three.js-master/build/three.module.js'
import { Box, Stack, TextField, Button } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { GLTFLoader } from './three.js-master/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from './three.js-master/examples/jsm/controls/OrbitControls.js'

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
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f7c6e7')

    const loader = new GLTFLoader()
    loader.load(
      '/cloud_tea.glb',
      function (glb) {
        const model = glb.scene
        model.scale.set(8, 8, 8)
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
    camera.position.set(0, 1, 2)
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

    const controls = new OrbitControls(camera, canvasRef.current)
    controls.enableDamping = true

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
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
      renderer.dispose()
      controls.dispose()
    }
  }, [])

  return (
    <Box
  width="100vw"
  height="100vh"
  display="flex"
  flexDirection="row"
  justifyContent="space-between"
  alignItems="stretch" // Use "stretch" to ensure both elements fill the full height
  sx={{ boxSizing: 'border-box', overflow: 'hidden', backgroundColor: '#f7c6e7' }} // Ensure no overflow
>
  {/* Canvas element for Three.js */}
  <Box
    width="50vw"
    height="100vh"
    display="flex"
    justifyContent="center"
    alignItems="center"
    sx={{ boxSizing: 'border-box' }}
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
    sx={{ boxSizing: 'border-box', overflow: 'hidden' }} // Ensure no overflow
  >
    <Stack
      direction={'column'}
      width="100%" // Set width to full to match 50vw
      height="80%" // Set height to full to match 100vh
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
              borderRadius={16}
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
