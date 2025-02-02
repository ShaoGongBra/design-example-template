import Taro from '@tarojs/taro'
import { Column, Empty, Row, toast } from '@/duxui'
import { Design, ComponentList, Editor, TemplateItem, NodePreview, Layer, Attr, defineComponentConfigs, Export } from '@/design/Design'
import { defineComponents } from '@/design'
import { Modal, Text } from '@/design/Design/common'
import { InputBase, Switch, Form } from '@/design/Design/attr/form'
import { useDesignContext } from '@/design/Design/utils/context'
import { getMedia } from '@/duxapp/utils/net/util'
import { useCallback, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import * as design from '@/design/Component/config'
import * as form from '@/duxuiDesign/components/form/config'
import * as layout from '@/duxuiDesign/components/layout/config'
import * as show from '@/duxuiDesign/components/show/config'
import { user, request, List as DesignList, usePageData } from './util'
import '../../../theme.scss'
import '../../../app.scss'

import './index.scss'

Taro.initPxTransform({
  designWidth: 375,
  deviceRatio: {
    375: 1.25
  }
})

defineComponents({
  ...design.comps,
  ...show.comps,
  ...layout.comps,
  ...form.comps,
})

defineComponentConfigs({
  ...design.config,
  ...show.config,
  ...layout.config,
  ...form.config,
})

export default function DuxDesign({ config, ...props }) {

  return <Design Design={DuxDesign} config={{ ...defaultConfig, ...config }} {...props}>
    <Row grow className='design-page'>
      <Menus />
      <div className='center'>
        <div className='editor'>
          <div className='phone'>
            <Editor />
          </div>
        </div>
      </div>
      <Column className='attr-layer'>
        <div className='item attr'>
          <Attr />
        </div>
        <LayerRender />
      </Column>
    </Row>
  </Design>
}

const LayerRender = () => {

  const [node, setNode] = useState(null)

  const [exportNode, setExportNode] = useState(null)

  const layerRightClick = useCallback(event => {
    if (event.node.tag === 'root' && !event.node.child.length) {
      return event.menu
    }
    event.menu.push({
      text: '添加模板', value: () => setNode(event.node.tag === 'root' ? event.node.child : [event.node])
    })
    event.menu.push({
      text: '导出', value: () => setExportNode(event.node.tag === 'root' ? event.node.child : [event.node])
    })
    return event.menu
  }, [])

  const submit = useCallback(async data => {
    if (!data.title) {
      return toast('请输入标题')
    }
    if (!data.tags) {
      return toast('请输入标签')
    }
    await request({
      url: 'services/appTheme',
      method: 'POST',
      data: {
        ...data,
        tags: data.tags.split(' '),
        data: JSON.stringify(node)
      },
      toast: true,
      loading: true
    })
    setNode(null)
  }, [node])

  return <>
    <div className='item'>
      <Layer onContextMenuBefore={layerRightClick} />
    </div>
    <Modal show={!!node} onClose={() => setNode(null)}>
      <Login>
        <Form onSubmit={submit}>
          <div className='add-template'>
            <Row items='center' justify='between' className='head'>
              <Text className='title'>添加到模板</Text>
              <Form.Submit>
                <Text className='add'>添加</Text>
              </Form.Submit>
            </Row>
            <Text className='name'>名称</Text>
            <Form.Item field='title'>
              <InputBase placeholder='模板名称' />
            </Form.Item>
            <Text className='name'>标签</Text>
            <Form.Item field='tags'>
              <InputBase placeholder='标签(多个用空格分隔)' />
            </Form.Item>
            <Text className='name'>是否公开</Text>
            <Form.Item field='share'>
              <Switch />
            </Form.Item>
            <Text className='name'>预览</Text>
            {!!node?.length && <NodePreview nodes={node} />}
          </div>
        </Form>
      </Login>
    </Modal>
    <Modal show={!!exportNode} onClose={() => setExportNode(null)}>
      {!!exportNode && <Export nodes={exportNode} />}
    </Modal>
  </>
}

const Login = ({ children, onLogin }) => {

  const userInfo = user.useData()

  const submit = useCallback(async data => {
    if (!data.username) {
      return toast('请输入用户名')
    }
    if (!data.password) {
      return toast('请输入密码')
    }
    const info = await request({
      url: 'package/auth/token',
      method: 'POST',
      data,
      toast: true,
      loading: true
    })
    user.set(info)
    onLogin?.()
  }, [onLogin])

  if (userInfo.token) {
    return children
  }

  return <div className='user-login'>
    <Form onSubmit={submit}>
      <Row items='center' justify='between' className='head'>
        <Column className='left'>
          <Text className='title'>用户登录</Text>
          <Text className='reg' color={2}
            onClick={() => {
              // 跳转到注册页面
              window.open('https://www.dux.cn', '_blank')
            }}
          >没有账号?去注册</Text>
        </Column>
        <Form.Submit>
          <Text className='add'>登录</Text>
        </Form.Submit>
      </Row>
      <Text className='name'>用户名</Text>
      <Form.Item field='username'>
        <InputBase placeholder='用户名' />
      </Form.Item>
      <Text className='name'>密码</Text>
      <Form.Item field='password'>
        <InputBase placeholder='密码' type='password' />
      </Form.Item>
    </Form>
  </div>
}

const Menus = () => {

  const [select, setSelect] = useState(0)

  const { config } = useDesignContext()

  const loads = useRef([])

  if (!loads.current[select]) {
    loads.current[select] = true
  }

  return <>
    <div className='menus'>
      {
        menus.map((item, index) => {
          const isSelect = select === index
          return <Text
            key={item.name}
            onClick={() => setSelect(index)}
            className={classNames(`item shop-design shop-design-${item.icon}`, isSelect && 'select')}
            style={{
              backgroundColor: !isSelect ? 'transparent' : config?.theme?.dark ? '#353535' : '#e8e8e8'
            }}
          />
        })
      }
    </div>
    {
      menus.map((item, index) => {
        if (!loads.current[index]) {
          return
        }
        const Comp = menus[index].Comp
        return <div key={item.name} className={classNames('comp-item', select === index && 'show')}>
          <Comp />
        </div>
      })
    }
    {
      loads.current
    }
  </>
}

const Template = () => {

  const [keyword, setKeyword] = useState('')

  const [tag, setTag] = useState('')

  const [my, setMy] = useState(0)

  const userInfo = user.useData()

  const [showLogin, setShowLogin] = useState(false)

  return <div className='template'>
    {!userInfo.token && <Row className='template-login'>
      <Text className='desc' color={2}>登录后可使用私有模板</Text>
      <Text className='login' onClick={() => setShowLogin(true)}>登录</Text>
    </Row>}
    <DesignList
      url='services/appTheme'
      data={{
        keyword,
        tag,
        my
      }}
      renderEmpty={<Empty title='暂无模板' />}
      renderHeader={<>
        <InputBase className='template-search' placeholder='搜索模板' value={keyword} onChange={setKeyword} throttle />
        <Tags value={tag} onChange={setTag} my={my} setMy={setMy} />
      </>}
      renderItem={TemplateListItem}
      refresh={false}
    />
    <Modal show={showLogin} onClose={() => setShowLogin(false)}>
      <Login onLogin={() => setShowLogin(false)} />
    </Modal>
  </div>
}

const TemplateListItem = ({ item, action }) => {

  const [nodes] = useMemo(() => {
    return [JSON.parse(item.data)]
  }, [item.data])

  const del = useCallback(async () => {
    await request({
      url: `services/appTheme/${item.id}`,
      method: 'DELETE',
      loading: true,
      toast: true
    })
    action.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  return <Column key={item.id} className='template-item'>
    <TemplateItem nodes={nodes} />
    <Row className='info'>
      <Text className='name' color={2}>{item.title}</Text>
      {item.is_my && <Text className='del' onClick={del}>删除</Text>}
    </Row>
  </Column>
}

const Tags = ({ value, onChange, my, setMy }) => {

  const userInfo = user.useData()

  const [tags] = usePageData('services/appThemeTags')

  const [expand, setExpand] = useState(false)
  const showTags = useMemo(() => {
    if (expand) {
      return tags.sort((a, b) => b.count - a.count)
    }
    return tags.sort((a, b) => b.count - a.count).slice(0, userInfo.token ? 4 : 5)
  }, [expand, tags, userInfo.token])

  return <>
    <Row className='tags' wrap>
      {!!userInfo.token && <Text
        className={classNames('item', my && 'select')}
        onClick={() => setMy(my ? 0 : 1)}
      >我的模板</Text>}
      {
        showTags.map(item => {
          const isSelect = value === item.name
          return <Text key={item.id}
            className={classNames('item', isSelect && 'select')}
            onClick={() => onChange(isSelect ? '' : item.name)}
          >{item.name}({item.count})</Text>
        })
      }
      {tags.length > (userInfo.token ? 4 : 5) && <Text
        className='item'
        onClick={() => setExpand(!expand)}
      >{expand ? '收起' : `更多(${tags.length - (userInfo.token ? 4 : 5)})`}</Text>}
    </Row>
  </>

}

const menus = [
  {
    name: '组件',
    icon: 'component',
    Comp: ComponentList
  },
  {
    name: '模板',
    icon: 'template',
    Comp: Template
  }
]

const defaultConfig = {
  upload: async (type, option) => {
    const res = await getMedia(type, option)
    return res.map(item => item.path)
  },
  theme: {
    dark: false,
  },
  link: []
}

DuxDesign.defineComponents = defineComponents
DuxDesign.defineComponentConfigs = defineComponentConfigs
