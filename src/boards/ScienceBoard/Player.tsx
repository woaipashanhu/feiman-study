/**
 * ============================================================
 *  科学可视化 — 3D互动播放页（改造版）
 *
 *  统一顶部按钮栏：← 返回 | 标题 | 📬 消息 | ☰ 列表
 *  列表抽屉：右侧滑出，展示所有场景，可切换
 * ============================================================
 */
import { Suspense, useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useContentLoader } from '@/shared/hooks'
import type { ScienceData, ScienceScene } from '@/types/content'
import { setOGMeta } from '@/shared/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, List, Play, X } from 'phosphor-react'

// 场景ID → 场景描述映射
const SCENE_META: Record<string, { name: string; hint: string; color: string }> = {
  'atom-structure': { name: '原子结构', hint: '拖拽旋转 · 滚轮缩放', color: '#3B82F6' },
  'solar-system': { name: '太阳系漫游', hint: '拖拽旋转 · 滚轮缩放', color: '#F59E0B' },
  'wave-interference': { name: '波的干涉', hint: '拖拽旋转 · 滚轮缩放', color: '#06B6D4' },
  'dna-helix': { name: 'DNA双螺旋', hint: '拖拽旋转 · 滚轮缩放', color: '#8B5CF6' },
  'molecule-builder': { name: '分子模型', hint: '拖拽旋转 · 滚轮缩放', color: '#10B981' },
  'crystal-lattice': { name: '晶体结构', hint: '拖拽旋转 · 滚轮缩放', color: '#EC4899' },
  'cell-structure': { name: '细胞探秘', hint: '拖拽旋转 · 滚轮缩放', color: '#EF4444' },
  'blood-circulation': { name: '血液循环', hint: '拖拽旋转 · 滚轮缩放', color: '#DC2626' },
  'earth-layers': { name: '地球内部', hint: '拖拽旋转 · 滚轮缩放', color: '#F97316' },
  'moon-phases': { name: '月相变化', hint: '拖拽旋转 · 滚轮缩放', color: '#94A3B8' },
  'tectonic-plates': { name: '板块构造', hint: '拖拽旋转 · 滚轮缩放', color: '#78716C' },
}

/** 默认 meta */
const DEFAULT_META = { name: '3D科学探索', hint: '拖拽旋转 · 滚轮缩放', color: '#3B82F6' }

export default function SciencePlayer() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showHint, setShowHint] = useState(true)
  const [showList, setShowList] = useState(false)
  const { data: scienceData } = useContentLoader<ScienceData>({
    url: '/data/science.json',
    type: 'science',
  })

  // 查找场景信息
  const sceneInfo = findScene(scienceData, id)
  const meta = (id ? SCENE_META[id] : null) || DEFAULT_META

  // OG 标签
  useEffect(() => {
    setOGMeta({
      title: `${meta.name} - 费曼科学课`,
      description: sceneInfo?.description || '3D互动科学探索',
    })
  }, [id, meta, sceneInfo])

  // 隐藏提示
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  // 找到同分类的下一个/上一个场景
  const navScenes = getNavScenes(scienceData, id)
  const goNext = useCallback(() => {
    if (navScenes.next) navigate(`/science/${navScenes.next}`)
  }, [navigate, navScenes.next])
  const goPrev = useCallback(() => {
    if (navScenes.prev) navigate(`/science/${navScenes.prev}`)
  }, [navigate, navScenes.prev])

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
      {/* 统一顶部按钮栏 */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm flex-shrink-0 z-20">
        {/* 左侧：返回按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/science')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={18} weight="regular" className="text-white/80" />
        </motion.button>

        {/* 中间：标题 */}
        <h1 className="text-sm font-medium text-white/90 truncate max-w-[40%] text-center">
          {sceneInfo?.title || meta.name}
        </h1>

        {/* 右侧：消息 + 列表 */}
        <div className="flex items-center gap-2">
          {/* 消息按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors relative"
          >
            <EnvelopeSimple size={18} weight="regular" className="text-white/80" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900" />
          </motion.button>

          {/* 列表按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowList(true)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <List size={18} weight="regular" className="text-white/80" />
          </motion.button>
        </div>
      </header>

      {/* 3D 画布区域 */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <SceneContent sceneId={id} />
            <Environment preset="night" />
            <OrbitControls
              enablePan={false}
              minDistance={2}
              maxDistance={15}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>

        {/* 操作提示 */}
        {showHint && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-fade-in">
            <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white/70 text-xs">
              {meta.hint}
            </div>
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      <footer className="flex-shrink-0 px-4 py-3 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/40 truncate">{sceneInfo?.description || '3D互动探索'}</p>
          </div>

          {/* 上一个 / 下一个 导航 */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={goPrev}
              disabled={!navScenes.prev}
              className="p-2 rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-colors"
              title="上一个"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-white/70" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={goNext}
              disabled={!navScenes.next}
              className="p-2 rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-colors"
              title="下一个"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-white/70" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* 列表抽屉 */}
      <AnimatePresence>
        {showList && (
          <SceneListDrawer
            scienceData={scienceData}
            currentId={id}
            onClose={() => setShowList(false)}
            onSelect={(sceneId) => {
              navigate(`/science/${sceneId}`)
              setShowList(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== 列表抽屉组件 ====================

function SceneListDrawer({
  scienceData,
  currentId,
  onClose,
  onSelect,
}: {
  scienceData: ScienceData | null
  currentId: string
  onClose: () => void
  onSelect: (sceneId: string) => void
}) {
  const categories = scienceData?.categories || []

  return (
    <>
      {/* 遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30"
      />

      {/* 抽屉 */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-md z-40 flex flex-col"
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white/90">场景列表</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={16} weight="regular" className="text-white/70" />
          </motion.button>
        </div>

        {/* 分类列表 */}
        <div className="flex-1 overflow-y-auto py-2">
          {categories.map((cat) => (
            <div key={cat.id} className="mb-4">
              {/* 分类标题 */}
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-medium text-white/60">{cat.name}</span>
                <div className="flex-1 h-px bg-white/10 ml-2" />
              </div>

              {/* 场景列表 */}
              <div className="px-2 space-y-1">
                {cat.scenes.map((scene) => {
                  const isActive = scene.id === currentId
                  return (
                    <motion.button
                      key={scene.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect(scene.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isActive
                          ? 'bg-white/15'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* 缩略图 */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden"
                        style={{
                          backgroundColor: isActive ? cat.color + '30' : cat.color + '15',
                          color: cat.color,
                        }}
                      >
                        {scene.thumbnail ? (
                          <img src={scene.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          scene.title[0]
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/80'}`}>
                          {scene.title}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">{scene.description}</p>
                      </div>

                      {/* 播放指示 */}
                      {isActive && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                          <Play size={10} weight="fill" style={{ color: cat.color }} />
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

// ==================== 3D 场景内容 ====================

/** 根据场景ID渲染不同的3D内容 */
function SceneContent({ sceneId }: { sceneId: string }) {
  switch (sceneId) {
    case 'atom-structure':
      return <AtomScene />
    case 'solar-system':
      return <SolarSystemScene />
    case 'dna-helix':
      return <DNAScene />
    case 'wave-interference':
      return <WaveScene />
    case 'crystal-lattice':
      return <CrystalScene />
    case 'earth-layers':
      return <EarthScene />
    case 'molecule-builder':
      return <MoleculeScene />
    case 'moon-phases':
      return <MoonScene />
    case 'cell-structure':
      return <CellScene />
    case 'blood-circulation':
      return <BloodScene />
    case 'tectonic-plates':
      return <TectonicScene />
    default:
      return <DefaultScene />
  }
}

// ==================== 各场景3D实现 ====================

/** 默认场景：旋转的抽象几何体 */
function DefaultScene() {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <mesh>
        <torusKnotGeometry args={[1, 0.35, 128, 32]} />
        <meshStandardMaterial color="#3B82F6" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** 原子结构：原子核 + 电子轨道 */
function AtomScene() {
  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#FEF08A" distance={10} />
      {/* 原子核 */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.3} />
      </mesh>
      {/* 电子轨道 */}
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, 0, (Math.PI * 2 / 3) * i]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.008, 16, 100]} />
            <meshBasicMaterial color="#3B82F6" opacity={0.3} transparent />
          </mesh>
          {/* 电子 */}
          <Electron orbitRadius={1.2} speed={2 + i * 0.5} delay={i * 0.67} />
        </group>
      ))}
    </group>
  )
}

/** 电子粒子 */
function Electron({ orbitRadius, speed, delay }: { orbitRadius: number; speed: number; delay: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed + delay
    ref.current.position.x = Math.cos(t) * orbitRadius
    ref.current.position.z = Math.sin(t) * orbitRadius
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#60A5FA" emissive="#3B82F6" emissiveIntensity={0.8} />
    </mesh>
  )
}

/** 太阳系：太阳 + 行星轨道 */
function SolarSystemScene() {
  const planets = [
    { radius: 0.15, dist: 1.2, speed: 4.0, color: '#B45309' },   // 水星
    { radius: 0.2, dist: 1.7, speed: 3.0, color: '#FCD34D' },   // 金星
    { radius: 0.22, dist: 2.3, speed: 2.5, color: '#3B82F6' },  // 地球
    { radius: 0.18, dist: 2.9, speed: 2.0, color: '#EF4444' },  // 火星
    { radius: 0.35, dist: 3.8, speed: 1.2, color: '#F97316' },  // 木星
    { radius: 0.3, dist: 4.6, speed: 0.9, color: '#EAB308' },   // 土星
    { radius: 0.25, dist: 5.4, speed: 0.6, color: '#67E8F9' },  // 天王星
    { radius: 0.24, dist: 6.2, speed: 0.4, color: '#3B82F6' },  // 海王星
  ]
  return (
    <group scale={0.65}>
      <ambientLight intensity={0.15} />
      {/* 太阳 */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#FEF08A" distance={20} />
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={0.6} />
      </mesh>
      {/* 行星 + 轨道 */}
      {planets.map((p, i) => (
        <group key={i}>
          {/* 轨道线 */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[p.dist, 0.005, 8, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.08} transparent />
          </mesh>
          {/* 行星 */}
          <Planet radius={p.radius} dist={p.dist} speed={p.speed} color={p.color} />
        </group>
      ))}
    </group>
  )
}

/** 公转行星 */
function Planet({ radius, dist, speed, color }: { radius: number; dist: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed * 0.3
    ref.current.position.x = Math.cos(t) * dist
    ref.current.position.z = Math.sin(t) * dist
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
    </mesh>
  )
}

/** DNA双螺旋 */
function DNAScene() {
  const STRAND_POINTS = 40
  const HEIGHT = 4
  const RADIUS = 0.8
  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} />
      <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#818CF8" />

      {/* 两条螺旋链 + 连接碱基 */}
      {Array.from({ length: STRAND_POINTS }).map((_, i) => {
        const t = (i / STRAND_POINTS) * Math.PI * 4
        const y = (i / STRAND_POINTS) * HEIGHT - HEIGHT / 2
        const x1 = Math.cos(t) * RADIUS
        const z1 = Math.sin(t) * RADIUS
        const x2 = Math.cos(t + Math.PI) * RADIUS
        const z2 = Math.sin(t + Math.PI) * RADIUS
        return (
          <group key={i}>
            {/* 链1 球体 */}
            <mesh position={[x1, y, z1]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.3} />
            </mesh>
            {/* 链2 球体 */}
            <mesh position={[x2, y, z2]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.3} />
            </mesh>
            {/* 碱基连接棒 */}
            {i % 2 === 0 && (
              <mesh position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, RADIUS * 2, 8]} />
                <meshStandardMaterial
                  color={i % 4 === 0 ? '#10B981' : i % 4 === 2 ? '#F59E0B' : '#8B5CF6'}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

/** 波的干涉 */
function WaveScene() {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={0.6} />
      <WavePlane />
    </group>
  )
}

function WavePlane() {
  const meshRef = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry as THREE.PlaneGeometry
    const pos = geo.attributes.position
    const t = state.clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const d1 = Math.sqrt((x - 1.5) ** 2 + y ** 2)
      const d2 = Math.sqrt((x + 1.5) ** 2 + y ** 2)
      const wave1 = Math.sin(d1 * 3 - t * 2) * 0.3
      const wave2 = Math.sin(d2 * 3 - t * 2) * 0.3
      pos.setZ(i, wave1 + wave2)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]}>
      <planeGeometry args={[8, 8, 64, 64]} />
      <meshStandardMaterial
        color="#06B6D4"
        wireframe
        side={THREE.DoubleSide}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

/** 晶体格子 */
function CrystalScene() {
  const SIZE = 3
  const SPACING = 1.2
  const atoms: [number, number, number][] = []
  for (let x = 0; x < SIZE; x++)
    for (let y = 0; y < SIZE; y++)
      for (let z = 0; z < SIZE; z++)
        atoms.push([
          (x - (SIZE - 1) / 2) * SPACING,
          (y - (SIZE - 1) / 2) * SPACING,
          (z - (SIZE - 1) / 2) * SPACING,
        ])
  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, -3, 3]} intensity={0.4} color="#EC4899" />
      {atoms.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#EC4899' : '#F0ABFC'}
            metalness={0.4}
            roughness={0.2}
          />
        </mesh>
      ))}
      {/* 键连线 */}
      <CrystalBonds atoms={atoms} spacing={SPACING} />
    </group>
  )
}

/** 晶体键连线 */
function CrystalBonds({ atoms, spacing }: { atoms: [number, number, number][]; spacing: number }) {
  const ref = useRef<THREE.LineSegments>(null!)
  useEffect(() => {
    if (!ref.current) return
    const points: [number, number, number][] = []
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const [ax, ay, az] = atoms[i]
        const [bx, by, bz] = atoms[j]
        const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2)
        if (Math.abs(dist - spacing) > 0.01) continue
        points.push([ax, ay, az], [bx, by, bz])
      }
    }
    if (points.length === 0) return
    const positions: number[] = []
    points.forEach((p) => positions.push(...p))
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    ref.current.geometry = geo
  }, [])
  return (
    <lineSegments ref={ref}>
      <lineBasicMaterial color="#F0ABFC" transparent opacity={0.3} />
    </lineSegments>
  )
}

/** 地球内部结构 */
function EarthScene() {
  return (
    <group>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      {/* 地壳 */}
      <mesh>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial color="#4ADE80" transparent opacity={0.25} wireframe />
      </mesh>
      {/* 地幔 */}
      <mesh>
        <sphereGeometry args={[1.55, 40, 40]} />
        <meshStandardMaterial color="#F97316" transparent opacity={0.35} />
      </mesh>
      {/* 外核 */}
      <mesh>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial color="#FACC15" transparent opacity={0.4} metalness={0.5} />
      </mesh>
      {/* 内核 */}
      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

/** 分子模型（水分子 H2O）*/
function MoleculeScene() {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      {/* 氧原子（中心） */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#EF4444" />
      </mesh>
      {/* 氢原子1 */}
      <mesh position={[0.7, 0.5, 0]}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* 氢原子2 */}
      <mesh position={[-0.7, 0.5, 0]}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* 化学键 */}
      <mesh position={[0.35, 0.25, 0]} rotation={[0, 0, 0.85]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        <meshStandardMaterial color="#94A3B8" />
      </mesh>
      <mesh position={[-0.35, 0.25, 0]} rotation={[0, 0, -0.85]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        <meshStandardMaterial color="#94A3B8" />
      </mesh>
    </group>
  )
}

/** 月相变化 */
function MoonScene() {
  const groupRef = useRef<THREE.Group>(null!)
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
  })
  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      {/* 阳光（从右侧照射） */}
      <pointLight position={[6, 0, 0]} intensity={2} color="#FEF08A" distance={20} />
      {/* 月球 */}
      <mesh>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** 细胞结构 */
function CellScene() {
  return (
    <group scale={1.2}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 3, 3]} intensity={0.7} />
      {/* 细胞膜 */}
      <mesh>
        <sphereGeometry args={[2, 40, 40]} />
        <meshStandardMaterial color="#86EFAC" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.95, 40, 40]} />
        <meshStandardMaterial color="#86EFAC" transparent opacity={0.1} />
      </mesh>
      {/* 细胞核 */}
      <mesh position={[0.3, 0.2, 0]}>
        <sphereGeometry args={[0.7, 28, 28]} />
        <meshStandardMaterial color="#3B82F6" transparent opacity={0.4} />
      </mesh>
      {/* 核仁 */}
      <mesh position={[0.4, 0.3, 0.2]}>
        <sphereGeometry args={[0.25, 20, 20]} />
        <meshStandardMaterial color="#1D4ED8" />
      </mesh>
      {/* 线粒体 */}
      {[[-1, 0.5, 0.3], [0.8, -0.6, -0.5], [-0.5, -0.7, 0.6]].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} rotation={[0.3 * idx, idx, 0]}>
          <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
          <meshStandardMaterial color="#F97316" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* 内质网（简化为曲线管道） */}
      <mesh position={[-0.8, -0.3, -0.2]} rotation={[0.5, 0.8, 0.3]}>
        <torusGeometry args={[0.5, 0.04, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#A78BFA" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

/** 血液循环 */
function BloodScene() {
  const particles = Array.from({ length: 30 }, () => ({
    offset: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 0.5,
    radius: 0.8 + Math.random() * 0.4,
  }))
  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#FEE2E2" distance={5} />
      {/* 血管壁 */}
      <mesh>
        <torusGeometry args={[1.5, 0.08, 16, 64]} />
        <meshStandardMaterial color="#FCA5A5" transparent opacity={0.3} />
      </mesh>
      {/* 红细胞 */}
      {particles.map((p, i) => (
        <BloodCell key={i} {...p} />
      ))}
    </group>
  )
}

function BloodCell({ offset, speed, radius }: { offset: number; speed: number; radius: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed + offset
    ref.current.position.x = Math.cos(t) * radius
    ref.current.position.y = Math.sin(t * 0.7) * 0.3
    ref.current.position.z = Math.sin(t) * radius
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshStandardMaterial color="#DC2626" />
    </mesh>
  )
}

/** 板块构造 */
function TectonicScene() {
  return (
    <group>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} />
      {/* 地核发光 */}
      <pointLight position={[0, -1.5, 0]} intensity={1} color="#F97316" distance={6} />
      {/* 地球表面（半球） */}
      <mesh>
        <sphereGeometry args={[2, 48, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#78716C" roughness={0.9} />
      </mesh>
      {/* 板块碎片 */}
      {[
        { pos: [0.5, 0.51, 0.3] as [number, number, number], rot: [0, 0.3, 0.1] as [number, number, number], color: '#166534', scale: 0.8 },
        { pos: [-0.6, 0.5, -0.2] as [number, number, number], rot: [0, -0.5, 0.2] as [number, number, number], color: '#1D4ED8', scale: 0.7 },
        { pos: [0.1, 0.52, -0.6] as [number, number, number], rot: [0.2, 1.2, 0] as [number, number, number], color: '#B45309', scale: 0.6 },
      ].map((plate, i) => (
        <mesh key={i} position={plate.pos} rotation={plate.rot} scale={plate.scale}>
          <boxGeometry args={[1, 0.08, 0.8]} />
          <meshStandardMaterial color={plate.color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// ==================== 工具函数 ====================

/** 在数据中查找指定ID的场景信息 */
function findScene(data: ScienceData | null, id: string): ScienceScene | undefined {
  if (!data) return undefined
  // 新格式：在 categories 中查找
  if (data.categories) {
    for (const cat of data.categories) {
      const found = cat.scenes.find((s) => s.id === id)
      if (found) return found
    }
  }
  // 旧格式：在 scenes 中查找
  if (data.scenes) {
    return data.scenes.find((s) => s.id === id)
  }
  return undefined
}

/** 获取相邻场景导航 */
function getNavScenes(data: ScienceData | null, currentId: string): { prev?: string; next?: string } {
  if (!data) return {}
  let allScenes: ScienceScene[] = []
  if (data.categories) {
    data.categories.forEach((cat) => allScenes.push(...cat.scenes))
  } else if (data.scenes) {
    allScenes = data.scenes
  }
  const idx = allScenes.findIndex((s) => s.id === currentId)
  if (idx < 0) return {}
  return {
    prev: idx > 0 ? allScenes[idx - 1].id : undefined,
    next: idx < allScenes.length - 1 ? allScenes[idx + 1].id : undefined,
  }
}
