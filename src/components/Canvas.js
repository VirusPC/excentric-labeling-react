import { Component, createRef } from 'react';
import * as d3 from 'd3';
import renderUsingD3 from './render-using-d3'

export default class Canvas extends Component {

  root = createRef();

  render() {
    
    return (
    <>
      <div id="canvas"  ref={this.root}></div>
    </>
    );
  }
  
  componentDidMount = () => {
    const { width } = this.props;
    const rootElem = this.root.current;
    renderUsingD3(rootElem, width, width * 0.6, this.extractInteractionParams(this.props));
  }

  shouldComponentUpdate = (props, state) => {
    if(this.props.fontSize === props.fontSize && this.props.lensRadius === props.lensRadius){
      return false;
    } 
    return true;
  }

  componentDidUpdate = () => {
      console.log("update")
    const { width } = this.props;
    const rootElem = this.root.current;
    d3.select(rootElem).selectAll(":root *").remove();
    renderUsingD3(rootElem, width, width * 0.6, this.extractInteractionParams(this.props));
  }

  setCurLabel = (value) => {
    const setCurLabel= this.props.setCurLabel;
    setCurLabel(value);
  }

  setRandomLabel = (value) => {
    const setRandomLabel= this.props.setRadomLabel;
    setRandomLabel(value);
  }

  extractInteractionParams(props) {
    const {fontSize, lensRadius} = props;
    return {
      fontSize: fontSize, 
      lensRadius: lensRadius, 
      setCurLabel: this.setCurLabel, 
      setRandomLabel: this.setRandomLabel
    }
  }


}