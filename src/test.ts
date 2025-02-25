export interface plotState {
  name: string
  description: string
  id: string
  meta: {
    width: string
    height: string
    left: string
    top: string
  }
  x?: string // 可选属性
  y?: string // 可选属性
  interactionType: string
  interactionKey: string
  allowedInteractionType: string
  tooltip?: {
    open: boolean
    text: string
  }
  legand?: {
    open: boolean //默认为true
    legendPosition: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' //legand的摆放位置
    legendOrientation: 'horizontal' | 'vertical' //legand的摆放方向
  }
  xAxis: {
    label?: string // x轴名称
    format?: string // x轴坐标格式化函数
    angle?: number // x轴标签旋转角度
    tickSize?: number // x轴刻度线大小
  }
  yAxis: {
    label?: string // y轴名称
    format?: string // y轴坐标格式化函数
    angle?: number // y轴标签旋转角度
    tickSize?: number // y轴刻度线大小
  }
}

let graph = {
  name: 'BarVertical',
  id: 'xcfgvh',
  description: '', // 添加了空字符串作为描述，因为它是必需的但未提供。
  meta: {
    width: '20%',
    height: '60%',
    left: '15%',
    top: '5%',
  },
  x: 'year', // 已存在，保持不变
  y: 'height', // 已存在，保持不变
  interactionType: 'filter', // 已存在，保持不变
  interactionKey: 'height', // 已存在，保持不变
  allowedInteractionType: 'filter', // 原字段名为allowedInteractionType，这里调整以匹配接口
  tooltip: {
    open: false, // 默认值，可以根据需求调整
    text: '', // 默认值，可以根据需求调整
  },
  legand: {
    // 注意，plotState中定义的是"legand"而非"legend"
    open: true, // 默认为true
    legendPosition: 'top-right', // 默认值，可以根据需求调整
  },
  xAxis: {
    open: true,
    label: 'Year', // 示例x轴名称，可以按需设置
    format: '{x}年', // 可选，根据需求填写
    angle: 0, // 可选，默认角度为0度
    tickSize: 6, // 可选，默认刻度线大小
  },
  yAxis: {
    open: true,
    label: 'Height', // 示例y轴名称，可以按需设置
    format: '{y}%', // 可选，根据需求填写
    angle: 45, // 可选，默认角度为0度
    tickSize: 6, // 可选，默认刻度线大小
  },
}
