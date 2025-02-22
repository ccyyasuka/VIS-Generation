import React, { useRef, useEffect, useState, ReactNode } from 'react'
import { AppDispatch } from './redux/store'
import { useDispatch } from 'react-redux'
import { updateConfigPosition } from './redux/dataSlice'
export interface WrapperWithButtonProps {
  children: ReactNode
  offsetLeft: string
  offsetTop: string
  width: string
  height: string
  left: string
  top: string
  id: string
}

const WrapperWithButton: React.FC<WrapperWithButtonProps> = ({
  children,
  width,
  height,
  left,
  top,
  offsetLeft,
  offsetTop,
  id,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState({ left, top })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dispatch = useDispatch<AppDispatch>()
  const LeftRef = useRef('')
  const TopRef = useRef('')
  // 计算基于百分比的实际像素值
  const getPositionInPixels = () => {
    // debugger
    const offsetLeftFloat = parseInt(offsetLeft, 10) // 将 '15px' 转换为 15
    const offsetTopFloat = parseInt(offsetTop, 10)
    return { offsetLeftFloat, offsetTopFloat }
  }

  const { offsetLeftFloat, offsetTopFloat } = getPositionInPixels()

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    // debugger
    setIsDragging(true)
    e.preventDefault()
  }

  // 拖拽中
  const handleMouseMove = (e: MouseEvent) => {
    // debugger
    e.preventDefault()
    console.log('isDragging', isDragging)
    if (isDragging) {
      // debugger
      const newLeft = e.clientX - offsetLeftFloat
      const newTop = e.clientY - offsetTopFloat
      // 更新位置
      setPosition({
        left: `${newLeft}px`,
        top: `${newTop}px`,
      })
      LeftRef.current = `${newLeft}px`
      TopRef.current = `${newTop}px`
    }
    console.log('LeftRefLeftRefLeftRef', LeftRef.current, TopRef.current)
  }

  // 拖拽结束
  const handleMouseUp = (e: MouseEvent) => {
    // debugger
    e.preventDefault()
    setIsDragging(false)
    const newLeft = parseFloat(position.left)
    const newTop = parseFloat(position.top)
    console.log('LeftRefLeftRefLeftRef', LeftRef.current, TopRef.current)
    // 调用 Redux action 更新位置
    dispatch(updateConfigPosition(id, LeftRef.current, TopRef.current))
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseup', handleMouseUp)
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width,
        height,
        border: '1px solid gray',
        padding: '5px',
        borderRadius: '5px',
        display: 'inline-block',
        boxSizing: 'border-box',
      }}>
      <svg
        style={{
          position: 'absolute',
          left: '-10px',
          top: '-10px',
          width: '20px',
          height: '20px',
        }}
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="4170"
        width="200"
        height="200">
        <path
          d="M542.86 130.76m0 32l0 178.14q0 32-32 32l0 0q-32 0-32-32l0-178.14q0-32 32-32l0 0q32 0 32 32Z"
          fill="#2C77E5"
          p-id="4171"></path>
        <path
          d="M556.118955 160.107879m-22.627417 22.627417l-87.094342 87.094342q-22.627417 22.627417-45.254834 0l0 0q-22.627417-22.627417 0-45.254834l87.094342-87.094342q22.627417-22.627417 45.254834 0l0 0q22.627417 22.627417 0 45.254834Z"
          fill="#2C77E5"
          p-id="4172"></path>
        <path
          d="M600.233636 292.45847m-22.627417-22.627417l-87.094343-87.094343q-22.627417-22.627417 0-45.254834l0 0q22.627417-22.627417 45.254834 0l87.094343 87.094343q22.627417 22.627417 0 45.254834l0 0q-22.627417 22.627417-45.254834 0Z"
          fill="#2C77E5"
          p-id="4173"></path>
        <path
          d="M481.14 893.33m0-32l0-178.14q0-32 32-32l0 0q32 0 32 32l0 178.14q0 32-32 32l0 0q-32 0-32-32Z"
          fill="#2C77E5"
          p-id="4174"></path>
        <path
          d="M467.892409 863.975757m22.627417-22.627417l87.094342-87.094342q22.627417-22.627417 45.254834 0l0 0q22.627417 22.627417 0 45.254834l-87.094342 87.094342q-22.627417 22.627417-45.254834 0l0 0q-22.627417-22.627417 0-45.254834Z"
          fill="#2C77E5"
          p-id="4175"></path>
        <path
          d="M423.756172 731.623995m22.627417 22.627417l87.094342 87.094342q22.627417 22.627417 0 45.254834l0 0q-22.627417 22.627417-45.254834 0l-87.094342-87.094342q-22.627417-22.627417 0-45.254834l0 0q22.627417-22.627417 45.254834 0Z"
          fill="#2C77E5"
          p-id="4176"></path>
        <path
          d="M130.71 481.18m32 0l178.14 0q32 0 32 32l0 0q0 32-32 32l-178.14 0q-32 0-32-32l0 0q0-32 32-32Z"
          fill="#2C77E5"
          p-id="4177"></path>
        <path
          d="M160.06595 467.94053m22.627417 22.627417l87.094342 87.094343q22.627417 22.627417 0 45.254834l0 0q-22.627417 22.627417-45.254834 0l-87.094342-87.094343q-22.627417-22.627417 0-45.254834l0 0q22.627417-22.627417 45.254834 0Z"
          fill="#2C77E5"
          p-id="4178"></path>
        <path
          d="M292.417834 423.814486m-22.627417 22.627417l-87.094343 87.094342q-22.627417 22.627417-45.254834 0l0 0q-22.627417-22.627417 0-45.254834l87.094343-87.094342q22.627417-22.627417 45.254834 0l0 0q22.627417 22.627417 0 45.254834Z"
          fill="#2C77E5"
          p-id="4179"></path>
        <path
          d="M893.29 542.9m-32 0l-178.14 0q-32 0-32-32l0 0q0-32 32-32l178.14 0q32 0 32 32l0 0q0 32-32 32Z"
          fill="#2C77E5"
          p-id="4180"></path>
        <path
          d="M863.924221 556.156712m-22.627417-22.627417l-87.094342-87.094342q-22.627417-22.627417 0-45.254834l0 0q22.627417-22.627417 45.254834 0l87.094342 87.094342q22.627417 22.627417 0 45.254834l0 0q-22.627417 22.627417-45.254834 0Z"
          fill="#2C77E5"
          p-id="4181"></path>
        <path
          d="M731.582359 600.281636m22.627417-22.627417l87.094342-87.094343q22.627417-22.627417 45.254834 0l0 0q22.627417 22.627417 0 45.254834l-87.094342 87.094343q-22.627417 22.627417-45.254834 0l0 0q-22.627417-22.627417 0-45.254834Z"
          fill="#2C77E5"
          p-id="4182"></path>
        <path
          d="M510.83 512.73m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          fill="#1AD8E2"
          p-id="4183"></path>
      </svg>

      <div
        onMouseDown={handleMouseDown}
        // onMouseUp={handleMouseUp}
        style={{
          position: 'absolute',
          left: '-10px',
          top: '-10px',
          width: '20px',
          height: '20px',
          backgroundColor: 'none',
          cursor: 'move',
        }}
      />

      {children}
      {/* <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          bottom: '5px',
          right: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '3px',
          cursor: 'pointer',
        }}>
        Close
      </button> */}
    </div>
  )
}

export interface figWrapperProps {
  offsetLeft: string
  offsetTop: string
  id: string
}

export default WrapperWithButton
