import Canvas from "./components/Canvas"
import { Slider, Typography, Input, Row, Col } from 'antd'
// import { Content, Footer, Header } from "antd/lib/layout/layout";
import 'antd/dist/antd.css'
import "./App.css"
import { useState } from 'react'

const { Title, Text } = Typography;

//const sliderStyle = { display: "inline-block" };

function App() {
  const width = 800;
  const height = 1000;
  const defaultFontSize = 10;
  const defaultLensRadius = 20;

  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [lensRadius, setLensRadius] = useState(defaultLensRadius);
  const [curLabel, setCurLabel] = useState("");
  const [randomLabel, setRadomLabel] = useState("");

  return (
    <div className="App" style={{width: width, height: height,}}>
      <Title align={"center"} level={2}>Excentric labels</Title>
      <br></br>
      <Row justify="center" align="middle">
        <Col span={3}>
          <Text strong>
            font size
            </Text>
        </Col>
        <Col span={7}>
          <Slider 
            defaultValue={defaultFontSize} 
            min={5} 
            max={20} 
            step={1} 
            dots={true} 
            onChange={setFontSize}/>
        </Col>
      </Row>
      <Row justify="center" align="middle">
        <Col span={3}>
          <Text strong>
            lens radius
          </Text>
        </Col>
        <Col span={7}>
          <Slider 
            defaultValue={defaultLensRadius} 
            min={10} 
            max={30} 
            step={1} 
            dots={true}
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
            random items:
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
