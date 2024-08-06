import { Component } from 'react'
import Taro from '@tarojs/taro'
import { Canvas } from '@tarojs/components'
import { Layout } from '@/duxapp'
import { formConfig } from '../Form/config'
import './index.scss'

export class Sign extends Component {
  state = {
    width: 0,
    height: 0,
    show: false,
  }

  static key = 0

  // eslint-disable-next-line no-use-before-define
  canvasID = `ui-sign-${++Sign.key}`

  layout = res => {
    this.setState({
      width: res.width,
      height: res.height,
      show: true,
    }, () => {
      Taro.nextTick(() => {
        const query = Taro.createSelectorQuery()
        query.select(`#${this.canvasID}`)
          .fields({ node: true, size: true })
          .exec((_res) => {
            const canvas = _res[0].node
            const ctx = canvas.getContext('2d')

            const dpr = Taro.getSystemInfoSync().pixelRatio
            canvas.width = _res[0].width * dpr
            canvas.height = _res[0].height * dpr
            ctx.scale(dpr, dpr)

            this.ctx = ctx
            this.canvas = canvas

            const { color = '#333333' } = this.props
            //设置线的颜色
            ctx.strokeStyle = color
            //设置线的宽度
            ctx.lineWidth = 5
            //设置线两端端点样式更加圆润
            ctx.lineCap = 'round'
            //设置两条线连接处更加圆润
            ctx.lineJoin = 'round'
          })
      })
    })
  }

  ctx = null
  touchs = []
  touchCount = 0

  touchStart = e => {
    e.preventDefault()
    this.touchs.push({
      x: e.touches[0].x,
      y: e.touches[0].y,
    })
  }

  touchMove = e => {
    e.preventDefault()
    this.touchs.push({
      x: e.touches[0].x,
      y: e.touches[0].y,
    })
    this.touchCount++
    if (this.touchs.length >= 2) {
      this.draw()
    }
  }

  touchEnd = e => {
    e.preventDefault()
    this.touchs.splice(0, this.touchs.length)
  }

  touchCancel = () => {
    this.touchs.splice(0, this.touchs.length)
  }

  draw() {
    const ctx = this.ctx
    if (!ctx) {
      return
    }
    const point1 = this.touchs[0]
    const point2 = this.touchs[1]
    // 删除第一个元素
    this.touchs.shift()
    ctx.moveTo(point1.x, point1.y)
    ctx.lineTo(point2.x, point2.y)
    ctx.stroke()
  }

  clear() {
    const ctx = this.ctx
    if (!ctx) {
      return
    }
    this.touchCount = 0
    ctx.clearRect(0, 0, this.state.width, this.state.height)
    ctx.beginPath()
  }

  async save() {

    if (this.touchCount < 30) {
      throw '笔画太少了'
    }

    const uploadTempFile = formConfig.getUploadTempFile('uploadTempFile')

    const res = await Taro.canvasToTempFilePath(
      {
        canvas: this.canvas,
        fileType: 'png'
      }
    )

    const [url] = await uploadTempFile([{ path: res.tempFilePath }])
    this.props.onChange?.(url)
    return url
  }

  render() {
    const { style } = this.props
    const { width, height, show } = this.state
    return (
      <Layout className='Sign' onLayout={this.layout}>
        {show && (
          <Canvas
            type='2d'
            id={this.canvasID}
            style={{ ...style, width: width + 'px', height: height + 'px' }}
            onTouchStart={this.touchStart}
            onTouchMove={this.touchMove}
            onTouchEnd={this.touchEnd}
            onTouchCancel={this.touchCancel}
          />
        )}
      </Layout>
    )
  }
}
