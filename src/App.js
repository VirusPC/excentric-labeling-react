import TopWidgets from "./components/TopWidgets"
import Canvas from "./components/Canvas"
import { Slider, Typography, Input, Row, Col } from 'antd'
// import { Content, Footer, Header } from "antd/lib/layout/layout";
import 'antd/dist/antd.css'
import "./App.css"
import { Fragment, useState } from 'react'
import _ from 'lodash'

const { Title, Text } = Typography;

//const sliderStyle = { display: "inline-block" };

const width = 800;
const height = 1000;

const sliderParams = {
  fontSize: {
    name: "Font Size",
    min: 5,
    max: 20,
    default: 10,
    step: 1,
    marks: {},
  },
  lensRadius: {
    name: "Radius",
    min: 10,
    max: 30,
    default: 20,
    step: 1,
    marks: {},
  },
  labelsNum: {
    name: "Max Num",
    min: 1,
    max: 15,
    default: 10,
    step: 1,
    marks: {},
  }
};

for (const paramName in sliderParams) {
  const param = sliderParams[paramName];
  _.range(param.min, param.max + 1, param.step)
    .forEach((i) => param.marks[i] = i);
}

function App() {

  const [fontSize, setFontSize] = useState(sliderParams.fontSize.default);
  const [lensRadius, setLensRadius] = useState(sliderParams.lensRadius.default);
  const [maxLabelsNum, setMaxLabelsNum] = useState(sliderParams.labelsNum.default);
  const [curLabel, setCurLabel] = useState("");
  const [randomLabel, setRadomLabel] = useState("");

  return (
    <div className="App" style={{ width: width, height: height, }}>
      <Title align={"center"} level={2}>Excentric labels</Title>
      <br></br>

      <Row justify="center" align="middle">
        <Col span={2}>
          <Text strong>
            {sliderParams.fontSize.name}
          </Text>
        </Col>
        <Col span={13}>
          <Slider
            defaultValue={sliderParams.fontSize.default}
            min={sliderParams.fontSize.min}
            max={sliderParams.fontSize.max}
            step={sliderParams.fontSize.step}
            dots={false}
            marks={sliderParams.fontSize.marks}
            onChange={setFontSize} />
        </Col>
      </Row>

      <Row justify="center" align="middle">
        <Col span={2}>
          <Text strong>
            {sliderParams.lensRadius.name}
          </Text>
        </Col>
        <Col span={13}>
          <Slider
            defaultValue={sliderParams.lensRadius.default}
            min={sliderParams.lensRadius.min}
            max={sliderParams.lensRadius.max}
            step={sliderParams.lensRadius.step}
            dots={false}
            marks={sliderParams.lensRadius.marks}
            onChange={setLensRadius} />
        </Col>
      </Row>
      
      <Row justify="center" align="middle">
        <Col span={2}>
          <Text strong>
            {sliderParams.labelsNum.name}
          </Text>
        </Col>
        <Col span={13}>
          <Slider
            defaultValue={sliderParams.labelsNum.default}
            min={sliderParams.labelsNum.min}
            max={sliderParams.labelsNum.max}
            step={sliderParams.labelsNum.step}
            dots={false}
            marks={sliderParams.labelsNum.marks}
            onChange={setMaxLabelsNum} />
        </Col>
      </Row>

      <Row justify="center">
        <Col span={24}>
          <Canvas 
            width={width} 
            fontSize={fontSize} 
            lensRadius={lensRadius} 
            maxLabelsNum={maxLabelsNum}
            setCurLabel={setCurLabel} 
            setRadomLabel={setRadomLabel}
          ></Canvas>
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
