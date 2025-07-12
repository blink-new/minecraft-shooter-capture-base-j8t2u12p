import { useState, useEffect, useRef } from 'react'
import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'

interface Gun {
  id: string
  name: string
  damage: number
  fireRate: number // shots per second
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
  position: { x: number; y: number }
  currentGun: string
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
    name: 'AK-47 (No Stock)',
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
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 50, y: 50 })
  const [isFiring, setIsFiring] = useState(false)
  const [player, setPlayer] = useState<Player>({
    id: 'player1',
    name: 'Player',
    health: 100,
    maxHealth: 100,
    team: 'blue',
    kills: 0,
    deaths: 0,
    position: { x: 50, y: 50 },
    currentGun: 'pistol'
  })

  const gameAreaRef = useRef<HTMLDivElement>(null)

  // Handle mouse movement for crosshair
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setCrosshairPosition({ x, y })
      }
    }

    const gameArea = gameAreaRef.current
    if (gameArea) {
      gameArea.addEventListener('mousemove', handleMouseMove)
      return () => gameArea.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Handle shooting
  const handleShoot = () => {
    if (selectedGun.ammo > 0 && !isReloading) {
      setIsFiring(true)
      setSelectedGun(prev => ({ ...prev, ammo: prev.ammo - 1 }))
      setTimeout(() => setIsFiring(false), 100)
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 font-mono">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 border-b-4 border-gray-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-green-400">⬛ MINECRAFT SHOOTER</div>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              CAPTURE THE BASE
            </Badge>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="text-gray-300">Health:</span>
              <span className="text-red-400 font-bold ml-2">{player.health}/100</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-300">K/D:</span>
              <span className="text-green-400 font-bold ml-2">{player.kills}/{player.deaths}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Game View */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            ref={gameAreaRef}
            className="w-full h-full bg-gradient-to-b from-sky-300 to-green-300 relative cursor-crosshair"
            onClick={handleShoot}
          >
            {/* Minecraft-style background blocks */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-16 h-16 bg-green-600 border border-green-800"
                  style={{
                    left: `${(i % 10) * 10}%`,
                    top: `${Math.floor(i / 10) * 50}%`,
                  }}
                />
              ))}
            </div>

            {/* Crosshair */}
            <div
              className="absolute w-6 h-6 pointer-events-none"
              style={{
                left: `${crosshairPosition.x}%`,
                top: `${crosshairPosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={`w-full h-full ${isFiring ? 'animate-ping' : ''}`}>
                <div className="absolute w-0.5 h-6 bg-red-500 left-1/2 transform -translate-x-1/2"></div>
                <div className="absolute h-0.5 w-6 bg-red-500 top-1/2 transform -translate-y-1/2"></div>
                <div className="absolute w-2 h-2 border border-red-500 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            {/* Muzzle flash effect */}
            {isFiring && (
              <div
                className="absolute w-8 h-8 pointer-events-none animate-pulse"
                style={{
                  left: `${crosshairPosition.x}%`,
                  top: `${crosshairPosition.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-full h-full bg-yellow-400 rounded-full opacity-80"></div>
              </div>
            )}

            {/* Game objectives */}
            <div className="absolute top-4 left-4">
              <Card className="p-3 bg-black/80 text-white border-gray-600">
                <div className="text-sm font-bold text-blue-400 mb-1">🏁 BASE STATUS</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-400">Red Base:</span>
                    <span>🔴 CONTESTED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Blue Base:</span>
                    <span>🔵 SECURE</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Weapon Panel */}
        <div className="w-80 bg-gray-900 border-l-4 border-gray-700 p-4">
          <div className="space-y-4">
            {/* Current Weapon Display */}
            <Card className="p-4 bg-gray-800 border-gray-600">
              <div className="text-white">
                <div className="text-lg font-bold text-green-400 mb-2">
                  {selectedGun.name}
                </div>
                
                {/* Gun Visual */}
                <div className="mb-4 p-4 bg-gray-700 rounded border-2 border-gray-500">
                  {selectedGun.id === 'pistol' ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔫</div>
                      <div className="text-xs text-gray-300">Compact & Reliable</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔫</div>
                      <div className="text-xs text-gray-300">High Power, No Stock</div>
                    </div>
                  )}
                </div>

                {/* Ammo Counter */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Ammo:</span>
                    <span className="text-xl font-mono text-yellow-400">
                      {selectedGun.ammo}/{selectedGun.maxAmmo}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${(selectedGun.ammo / selectedGun.maxAmmo) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Reload Button */}
                <Button
                  onClick={handleReload}
                  disabled={isReloading || selectedGun.ammo === selectedGun.maxAmmo}
                  className="w-full mb-3 bg-blue-600 hover:bg-blue-700"
                >
                  {isReloading ? `Reloading... ${Math.round(reloadProgress)}%` : 'Reload (R)'}
                </Button>

                {/* Reload Progress */}
                {isReloading && (
                  <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${reloadProgress}%` }}
                    />
                  </div>
                )}

                {/* Gun Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Damage:</span>
                    <span className="text-red-400">{selectedGun.damage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Fire Rate:</span>
                    <span className="text-orange-400">{selectedGun.fireRate}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Range:</span>
                    <span className="text-green-400">{selectedGun.range}m</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Weapon Selection */}
            <Card className="p-4 bg-gray-800 border-gray-600">
              <div className="text-white">
                <div className="text-lg font-bold text-blue-400 mb-3">Weapons</div>
                <div className="space-y-2">
                  {guns.map((gun) => (
                    <Button
                      key={gun.id}
                      onClick={() => switchGun(gun.id)}
                      variant={selectedGun.id === gun.id ? "default" : "outline"}
                      className={`w-full text-left justify-start ${
                        selectedGun.id === gun.id 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-gray-700 hover:bg-gray-600 border-gray-500"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-semibold">{gun.name}</div>
                          <div className="text-xs opacity-75">
                            {gun.damage} DMG • {gun.fireRate}/s
                          </div>
                        </div>
                        <div className="text-2xl">
                          {gun.id === 'pistol' ? '🔫' : '🔫'}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Controls */}
            <Card className="p-4 bg-gray-800 border-gray-600">
              <div className="text-white">
                <div className="text-lg font-bold text-purple-400 mb-3">Controls</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Shoot:</span>
                    <span className="text-yellow-400">Left Click</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reload:</span>
                    <span className="text-yellow-400">R Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Switch Gun:</span>
                    <span className="text-yellow-400">1, 2 Keys</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Move:</span>
                    <span className="text-yellow-400">WASD</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App