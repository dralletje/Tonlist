import Colors from 'material-ui/lib/styles/colors';
import ColorManipulator from 'material-ui/lib/utils/color-manipulator';
import Spacing from 'material-ui/lib/styles/spacing';
import zIndex from 'material-ui/lib/styles/zIndex';

export default {
  spacing: Spacing,
  zIndex: zIndex,
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: "#55799d",
    primary2Color: Colors.red700,
    primary3Color: "#49647d",
    accent1Color: Colors.pinkA200,
    accent2Color: Colors.grey100,
    accent3Color: "#49647d",
    textColor: "white",
    alternateTextColor: Colors.white,
    canvasColor: Colors.white,
    borderColor: "#49647d",
    disabledColor: ColorManipulator.fade(Colors.darkBlack, 0.3),
    pickerHeaderColor: Colors.cyan500,
  }
};
