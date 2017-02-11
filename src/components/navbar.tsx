import {
  View,
  ViewStyle,
  StyleSheet
} from 'react-native'
import * as React from 'react'
// tslint:disable-next-line
const NavigationBar = require('react-native-navbar')
// tslint:disable-next-line
const Icon = require('react-native-vector-icons/FontAwesome')
import { Actions } from 'react-native-router-flux'
import Router from '../routers'

type Ianimation = 'fade' | 'slide' | 'none'

interface IProps {
  title: string,
  statusBar?: {
    statusBar: ViewStyle,
    hidden: boolean,
    tintColor: string,
    hideAnimation: Ianimation,
    showAnimation: Ianimation
  },
  leftButton?: JSX.Element,
  rightButton?: JSX.Element,
  showTitile?: boolean,
  children?: JSX.Element,
  hideBorder?: boolean,
  transparent?: boolean
}

class NavBar extends React.Component<IProps, any> {

  constructor(props: IProps) {
    super(props)
  }

  render () {
    const buttonWrapper = (children?: JSX.Element, style?: ViewStyle) => {
      return children &&
        <View style={[styles.item, style && style]}>{children}</View>
    }
    const defaultLeftButton = <Icon
      name='arrow-left'
      size={14}
      color='#bbb'
      onPress={this.navBack}
    />
    const {
      statusBar,
      leftButton = defaultLeftButton,
      rightButton,
      title,
      showTitile = true,
      hideBorder = false,
      transparent = false
    } = this.props
    return <NavigationBar
      statusBar={statusBar}
      leftButton={buttonWrapper(leftButton, { marginLeft: 10 })}
      rightButton={buttonWrapper(rightButton, { marginRight: 10})}
      title={showTitile ? { title, style: {fontSize: 14} } : <View style={{ height : 0}}/>}
      style={[styles.container, hideBorder && { borderWidth: 0 }, transparent && { backgroundColor: 'transparent' }]}
    />
  }

  private navBack = () => {
    Actions.pop()
  }
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    height: 40,
    borderColor: '#ccc'
  } as ViewStyle,
  item: {
    justifyContent: 'center'
  } as ViewStyle
})

export default NavBar