import Canvas from "./components/Canvas"
import { Slider, Typography, Input, Row, Col } from 'antd'
// import { Content, Footer, Header } from "antd/lib/layout/layout";
import 'antd/dist/antd.css'
import "./App.css"
import { useState } from 'react'
import _ from 'lodash'

const { Title, Text } = Typography;

//const sliderStyle = { display: "inline-block" };

function App() {
  const width = 800;
  const height = 1000;

  const minFontSize = 5;
  const maxFontSize = 20;
  const defaultFontSize = 10;
  const fontSizeStep = 1;

  const minLensRadius= 10;
  const maxLensRadius= 30;
  const defaultLensRadius = 20;
  const lensRadiusStep = 1;

  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [lensRadius, setLensRadius] = useState(defaultLensRadius);
  const [curLabel, setCurLabel] = useState("");
  const [randomLabel, setRadomLabel] = useState("");

  const fontSizeSliderMarks = {};
  const a = _.range(minFontSize, maxFontSize + 1, 1);
  //cosnt 

  return (
    <div className="App" style={{width: width, height: height,}}>
      <Title align={"center"} level={2}>Excentric labels</Title>
      <br></br>
      <Row justify="center" align="middle">
        <Col span={3}>
          <Text strong>
            Font Size
            </Text>
        </Col>
        <Col span={13}>
          <Slider 
            defaultValue={defaultFontSize} 
            min={minFontSize} 
            max={maxFontSize} 
            step={1} 
            //dots={true} 
            onChange={setFontSize}/>
        </Col>
      </Row>
      <Row justify="center" align="middle">
        <Col span={3}>
          <Text strong>
            Radius
          </Text>
        </Col>
        <Col span={13}>
          <Slider 
            defaultValue={defaultLensRadius} 
            min={minLensRadius} 
            max={maxLensRadius} 
            step={1} 
            dots={false}
            onChange = {setLensRadius}/>
        </Col>
      </Row>
      <Row justify="center">
        <Col span={24}>
          <Canvas width={width} fontSize={fontSize} lensRadius={lensRadius} setCurLabel={setCurLabel} setRadomLabel={setRadomLabel}></Canvas>
        </Col>
      </Row>
      <Row justify="center" align="middle">
        <Col span={2}>
          <Text strong>
            Name:
            </Text>
        </Col>
        <Col span={6}>
          <Input value={curLabel} disabled={true}></Input>
        </Col>
        <Col span={1}>
        </Col>
        <Col span={3}>
          <Text strong>
            Random Items:
            </Text>
        </Col>
        <Col span={6}>
          <Input value={randomLabel} disabled={true}></Input>
        </Col>
      </Row>
    </div>
  );
}

export default App;
