import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'

interface Gun {
  id: string
  name: string
  damage: number
  fireRate: number
  ammo: number
  maxAmmo: number
  reloadTime: number
  range: number
}

interface Player {
  id: string
  name: string
  health: number
  maxHealth: number
  team: 'red' | 'blue'
  kills: number
  deaths: number
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number }
  currentGun: string
}

interface Enemy {
  id: string
  position: { x: number; y: number; z: number }
  health: number
  team: 'red' | 'blue'
  isVisible: boolean
}

const guns: Gun[] = [
  {
    id: 'pistol',
    name: 'Minecraft Pistol',
    damage: 25,
    fireRate: 3,
    ammo: 12,
    maxAmmo: 12,
    reloadTime: 1.5,
    range: 30
  },
  {
    id: 'ak47',
    name: 'AK-47 Block Rifle',
    damage: 35,
    fireRate: 8,
    ammo: 30,
    maxAmmo: 30,
    reloadTime: 2.5,
    range: 50
  }
]

function App() {
  const [selectedGun, setSelectedGun] = useState<Gun>(guns[0])
  const [isReloading, setIsReloading] = useState(false)
  const [reloadProgress, setReloadProgress] = useState(0)
  const [isFiring, setIsFiring] = useState(false)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  const [player, setPlayer] = useState<Player>({
    id: 'player1',
    name: 'Player',
    health: 100,
    maxHealth: 100,
    team: 'blue',
    kills: 0,
    deaths: 0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0 },
    currentGun: 'pistol'
  })

  const [enemies, setEnemies] = useState<Enemy[]>([
    { id: 'enemy1', position: { x: 200, y: 0, z: 300 }, health: 100, team: 'red', isVisible: true },
    { id: 'enemy2', position: { x: -150, y: 0, z: 250 }, health: 100, team: 'red', isVisible: true },
    { id: 'enemy3', position: { x: 100, y: 0, z: 400 }, health: 100, team: 'red', isVisible: true }
  ])

  const [keys, setKeys] = useState<Record<string, boolean>>({})
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()

  // Pointer lock management
  const requestPointerLock = useCallback(() => {
    if (gameAreaRef.current) {
      gameAreaRef.current.requestPointerLock()
    }
  }, [])

  const exitPointerLock = useCallback(() => {
    document.exitPointerLock()
  }, [])

  // Handle pointer lock events
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === gameAreaRef.current)
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange)
  }, [])

  // Mouse look controls
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return

      const sensitivity = 0.003
      setPlayer(prev => ({
        ...prev,
        rotation: {
          x: Math.max(-Math.PI/2, Math.min(Math.PI/2, prev.rotation.x - e.movementY * sensitivity)),
          y: prev.rotation.y - e.movementX * sensitivity
        }
      }))
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [isPointerLocked])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }))
      
      switch (e.key.toLowerCase()) {
        case 'r':
          handleReload()
          break
        case '1':
          switchGun('pistol')
          break
        case '2':
          switchGun('ak47')
          break
        case 'escape':
          setShowMenu(prev => !prev)
          if (isPointerLocked) exitPointerLock()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPointerLocked])

  // Player movement
  useEffect(() => {
    const movePlayer = () => {
      if (!isPointerLocked) return

      const speed = 2
      const moveVector = { x: 0, z: 0 }

      if (keys['w']) {
        moveVector.x += Math.sin(player.rotation.y) * speed
        moveVector.z += Math.cos(player.rotation.y) * speed
      }
      if (keys['s']) {
        moveVector.x -= Math.sin(player.rotation.y) * speed
        moveVector.z -= Math.cos(player.rotation.y) * speed
      }
      if (keys['a']) {
        moveVector.x += Math.cos(player.rotation.y) * speed
        moveVector.z -= Math.sin(player.rotation.y) * speed
      }
      if (keys['d']) {
        moveVector.x -= Math.cos(player.rotation.y) * speed
        moveVector.z += Math.sin(player.rotation.y) * speed
      }

      if (moveVector.x !== 0 || moveVector.z !== 0) {
        setPlayer(prev => ({
          ...prev,
          position: {
            ...prev.position,
            x: prev.position.x + moveVector.x,
            z: prev.position.z + moveVector.z
          }
        }))
      }

      animationRef.current = requestAnimationFrame(movePlayer)
    }

    if (isPointerLocked) {
      animationRef.current = requestAnimationFrame(movePlayer)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [keys, player.rotation, isPointerLocked])

  // Handle shooting
  const handleShoot = useCallback(() => {
    if (selectedGun.ammo > 0 && !isReloading && isPointerLocked) {
      setIsFiring(true)
      setSelectedGun(prev => ({ ...prev, ammo: prev.ammo - 1 }))
      
      // Check for enemy hits (simple raycast simulation)
      const hitEnemy = enemies.find(enemy => {
        const dx = enemy.position.x - player.position.x
        const dz = enemy.position.z - player.position.z
        const distance = Math.sqrt(dx * dx + dz * dz)
        const angle = Math.atan2(dx, dz)
        const angleDiff = Math.abs(angle - player.rotation.y)
        
        return distance < selectedGun.range && angleDiff < 0.1 && enemy.health > 0
      })

      if (hitEnemy) {
        setEnemies(prev => prev.map(enemy => 
          enemy.id === hitEnemy.id 
            ? { ...enemy, health: Math.max(0, enemy.health - selectedGun.damage) }
            : enemy
        ))
        if (hitEnemy.health <= selectedGun.damage) {
          setPlayer(prev => ({ ...prev, kills: prev.kills + 1 }))
        }
      }
      
      setTimeout(() => setIsFiring(false), 100)
    }
  }, [selectedGun, isReloading, isPointerLocked, enemies, player.position, player.rotation])

  // Handle reload
  const handleReload = () => {
    if (isReloading || selectedGun.ammo === selectedGun.maxAmmo) return
    
    setIsReloading(true)
    setReloadProgress(0)
    
    const interval = setInterval(() => {
      setReloadProgress(prev => {
        const newProgress = prev + (100 / (selectedGun.reloadTime * 10))
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsReloading(false)
          setSelectedGun(prev => ({ ...prev, ammo: prev.maxAmmo }))
          return 100
        }
        return newProgress
      })
    }, 100)
  }

  // Handle gun switch
  const switchGun = (gunId: string) => {
    const gun = guns.find(g => g.id === gunId)
    if (gun) {
      setSelectedGun(gun)
      setPlayer(prev => ({ ...prev, currentGun: gunId }))
    }
  }

  // Calculate enemy screen positions for 3D effect
  const getEnemyScreenPosition = (enemy: Enemy) => {
    const dx = enemy.position.x - player.position.x
    const dz = enemy.position.z - player.position.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    
    if (distance > selectedGun.range) return null
    
    const angle = Math.atan2(dx, dz) - player.rotation.y
    const normalizedAngle = Math.atan2(Math.sin(angle), Math.cos(angle))
    
    if (Math.abs(normalizedAngle) > Math.PI / 3) return null // Outside FOV
    
    const screenX = 50 + (normalizedAngle / (Math.PI / 3)) * 40 // Map to screen space
    const size = Math.max(20, 100 / (distance / 50)) // Size based on distance
    
    return { x: screenX, size, distance }
  }

  return (
    <div className="min-h-screen bg-black font-mono overflow-hidden">
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full z-20 pointer-events-none">
        <div className="flex justify-between items-start p-4">
          <div className="pointer-events-auto">
            <Card className="p-3 bg-black/90 text-white border-green-500 border-2">
              <div className="text-lg font-bold text-green-400 mb-2">⬛ MINECRAFT FPS</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Health:</span>
                  <span className="text-red-400 font-bold">{player.health}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">K/D:</span>
                  <span className="text-green-400 font-bold">{player.kills}/{player.deaths}</span>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="pointer-events-auto">
            <Card className="p-3 bg-black/90 text-white border-blue-500 border-2">
              <div className="text-sm font-bold text-blue-400 mb-1">🏁 OBJECTIVES</div>
              <div className="space-y-1 text-xs">
                <div>🔴 Red Base: CONTESTED</div>
                <div>🔵 Blue Base: SECURE</div>
                <div className="text-yellow-400 mt-2">Eliminate enemies!</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Weapon HUD */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        <Card className="p-4 bg-black/90 text-white border-yellow-500 border-2">
          <div className="text-right">
            <div className="text-lg font-bold text-green-400 mb-2">{selectedGun.name}</div>
            <div className="text-3xl font-mono text-yellow-400 mb-2">
              {selectedGun.ammo.toString().padStart(2, '0')}/{selectedGun.maxAmmo.toString().padStart(2, '0')}
            </div>
            {isReloading && (
              <div className="text-sm text-blue-400 animate-pulse">
                RELOADING... {Math.round(reloadProgress)}%
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Crosshair */}
      {isPointerLocked && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className={`w-8 h-8 ${isFiring ? 'animate-ping' : ''}`}>
            <div className="absolute w-0.5 h-8 bg-red-500 left-1/2 transform -translate-x-1/2"></div>
            <div className="absolute h-0.5 w-8 bg-red-500 top-1/2 transform -translate-y-1/2"></div>
            <div className="absolute w-3 h-3 border-2 border-red-500 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      )}

      {/* Main Game View */}
      <div 
        ref={gameAreaRef}
        className="w-full h-screen relative bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 cursor-none"
        onClick={isPointerLocked ? handleShoot : requestPointerLock}
      >
        {/* 3D Environment Simulation */}
        <div className="absolute inset-0">
          {/* Ground/Floor blocks */}
          {Array.from({ length: 100 }).map((_, i) => {
            const x = (i % 10) * 10
            const z = Math.floor(i / 10) * 10
            const distance = Math.sqrt((x - 50) ** 2 + (z - 50) ** 2)
            const perspective = Math.max(0.3, 1 - distance / 200)
            
            return (
              <div
                key={`ground-${i}`}
                className="absolute bg-green-600 border border-green-800 opacity-60"
                style={{
                  left: `${40 + (x - 50) * perspective}%`,
                  top: `${60 + (z - 40) * perspective * 0.5}%`,
                  width: `${8 * perspective}%`,
                  height: `${4 * perspective}%`,
                  transform: `perspective(500px) rotateX(${45 + player.rotation.x * 20}deg)`
                }}
              />
            )
          })}

          {/* Building blocks */}
          {Array.from({ length: 20 }).map((_, i) => {
            const x = (i % 5) * 20 + 10
            const z = Math.floor(i / 5) * 30 + 50
            const dx = x - player.position.x / 10
            const dz = z - player.position.z / 10
            const distance = Math.sqrt(dx ** 2 + dz ** 2)
            const perspective = Math.max(0.1, 1 - distance / 100)
            
            return (
              <div
                key={`block-${i}`}
                className="absolute bg-stone-600 border-2 border-stone-800"
                style={{
                  left: `${45 + dx * perspective * 2}%`,
                  top: `${40 - dz * perspective + Math.sin(player.rotation.x) * 20}%`,
                  width: `${12 * perspective}%`,
                  height: `${16 * perspective}%`,
                  transform: `rotateY(${player.rotation.y * 10}deg)`
                }}
              />
            )
          })}

          {/* Enemies */}
          {enemies.map(enemy => {
            const screenPos = getEnemyScreenPosition(enemy)
            if (!screenPos || enemy.health <= 0) return null
            
            return (
              <div
                key={enemy.id}
                className="absolute transition-all duration-75"
                style={{
                  left: `${screenPos.x}%`,
                  top: '45%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative">
                  {/* Enemy body */}
                  <div 
                    className="bg-red-600 border-2 border-red-800 animate-pulse"
                    style={{
                      width: `${screenPos.size}px`,
                      height: `${screenPos.size * 1.5}px`
                    }}
                  >
                    {/* Head */}
                    <div 
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-red-500 border border-red-700"
                      style={{
                        width: `${screenPos.size * 0.6}px`,
                        height: `${screenPos.size * 0.6}px`
                      }}
                    />
                  </div>
                  
                  {/* Health bar */}
                  <div 
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black border border-white"
                    style={{ width: `${screenPos.size}px`, height: '4px' }}
                  >
                    <div 
                      className="h-full bg-red-500"
                      style={{ width: `${enemy.health}%` }}
                    />
                  </div>
                  
                  {/* Distance indicator */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white font-mono">
                    {Math.round(screenPos.distance)}m
                  </div>
                </div>
              </div>
            )
          })}

          {/* Muzzle flash */}
          {isFiring && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 bg-yellow-400 rounded-full animate-ping opacity-80"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Click to enter FPS mode */}
        {!isPointerLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <Card className="p-8 bg-black/90 text-white border-green-500 border-2 text-center">
              <div className="text-2xl font-bold text-green-400 mb-4">🎯 MINECRAFT FPS</div>
              <div className="text-lg mb-4">Click to Enter First-Person Mode</div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>WASD - Move</div>
                <div>Mouse - Look Around</div>
                <div>Left Click - Shoot</div>
                <div>R - Reload</div>
                <div>1, 2 - Switch Weapons</div>
                <div>ESC - Exit FPS Mode</div>
              </div>
            </Card>
          </div>
        )}

        {/* Pause Menu */}
        {showMenu && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <Card className="p-8 bg-black/95 text-white border-blue-500 border-2">
              <div className="text-2xl font-bold text-blue-400 mb-6 text-center">PAUSED</div>
              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    setShowMenu(false)
                    requestPointerLock()
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Resume Game
                </Button>
                <div className="text-center text-sm text-gray-300">
                  <div className="mb-2">Current Stats:</div>
                  <div>Kills: {player.kills}</div>
                  <div>Health: {player.health}/100</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App