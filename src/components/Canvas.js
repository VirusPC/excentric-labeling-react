import { Component, createRef } from 'react';
import * as d3 from 'd3';
import renderUsingD3 from './render-using-d3'

export default class Canvas extends Component {

  root = createRef();

  render() {
    
    return (
    <>
      <svg id="canvas"  ref={this.root}></svg>
    </>
    );
  }
  
  componentDidMount = () => {
    const {width, fontSize, lensRadius} = this.props;
    const rootElem = this.root.current;
    renderUsingD3(rootElem, width, fontSize, lensRadius, this.setCurLabel, this.setRandomLabel);
  }

  shouldComponentUpdate = (props, state) => {
    if(this.props.fontSize === props.fontSize && this.props.lensRadius === props.lensRadius){
      return false;
    } 
    return true;
  }

  componentDidUpdate = () => {
    const { width, fontSize, lensRadius } = this.props;
    const rootElem = this.root.current;
    d3.select(rootElem).selectAll(":root *").remove();
    renderUsingD3(rootElem, width, fontSize, lensRadius, this.setCurLabel, this.setRandomLabel);
  }

  setCurLabel = (value) => {
    const setCurLabel= this.props.setCurLabel;
    setCurLabel(value);
  }

  setRandomLabel = (value) => {
    const setRandomLabel= this.props.setRadomLabel;
    setRandomLabel(value);
  }


}