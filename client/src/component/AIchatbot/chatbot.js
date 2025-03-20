import React, { useState } from 'react';

// Component for model items in the sidebar
function ModelItem({ icon, name, rating, active = false }) {
  return (
    <li className={`flex items-center px-2 py-2 rounded-md cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
      <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs mr-2">
        {icon}
      </div>
      <div>{name}</div>
      <div className="ml-auto text-xs text-gray-500">{rating.includes('.') ? '★ ' : ''}{rating}</div>
    </li>
  );
}

// Component for topic tags
function TopicTag({ name }) {
  return (
    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 mr-1 mb-1">
      {name}
    </span>
  );
}

// Component for AI chips in the header
function AIChip({ icon, name }) {
  return (
    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs">
      <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-1">
        {icon}
      </span>
      {name}
      <span className="ml-1 cursor-pointer text-gray-500">×</span>
    </span>
  );
}

// Component for tabs
function Tab({ name, active, onClick }) {
  return (
    <div 
      className={`px-4 py-3 text-sm font-medium cursor-pointer ${active ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
      onClick={onClick}
    >
      {name}
    </div>
  );
}

// Component for messages
function Message({ avatar, name, isUser, model, content, likes, hasVariations, hasEdit }) {
  return (
    <div className="mb-5">
      <div className="flex items-center mb-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${isUser ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
          {avatar}
        </div>
        <div className="font-medium mr-2">{name}</div>
        {model && <div className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">{model}</div>}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm ml-10 text-sm leading-relaxed">
        {typeof content === 'string' ? content : content}
      </div>
      {!isUser && (
        <div className="flex mt-2 ml-10">
          <button className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded flex items-center mr-2">
            👍 {likes}
          </button>
          <button className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded flex items-center mr-2">
            💡 Enhance
          </button>
          <button className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded flex items-center">
            {hasVariations ? '🎨 Variations' : hasEdit ? '📝 Edit' : '🔄 Regenerate'}
          </button>
        </div>
      )}
    </div>
  );
}

const AIAggregator = () => {
  const [activeTab, setActiveTab] = useState('Chat');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 font-semibold text-lg border-b border-gray-200">
          AI Aggregator
        </div>
        
        {/* AI Models Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="font-semibold mb-2 text-sm text-gray-500">AI MODELS</div>
          <ul className="space-y-1">
            <ModelItem icon="C" name="Claude 3.7" rating="4.9" />
            <ModelItem icon="G" name="GPT-4o" rating="4.8" active={true} />
            <ModelItem icon="D" name="DALL-E 3" rating="4.7" />
            <ModelItem icon="L" name="Llama 3" rating="4.6" />
            <ModelItem icon="M" name="Midjourney" rating="4.9" />
            <ModelItem icon="S" name="Stable Diffusion" rating="4.5" />
            <ModelItem icon="V" name="VideoLLM" rating="4.3" />
            <ModelItem icon="+" name="Add Models" rating="" />
          </ul>
        </div>
        
        {/* Trending Topics Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="font-semibold mb-2 text-sm text-gray-500">TRENDING TOPICS</div>
          <div className="flex flex-wrap gap-1">
            <TopicTag name="AI Research" />
            <TopicTag name="Code Generation" />
            <TopicTag name="Creative Writing" />
            <TopicTag name="Data Analysis" />
            <TopicTag name="UI Design" />
          </div>
        </div>
        
        {/* Recommended Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="font-semibold mb-2 text-sm text-gray-500">RECOMMENDED FOR YOU</div>
          <ul className="space-y-1">
            <ModelItem icon="C" name="Claude 3.7" rating="Text" />
            <ModelItem icon="M" name="Midjourney" rating="Images" />
          </ul>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-15 border-b border-gray-200 flex items-center justify-between px-5 bg-white">
          <div className="font-medium">Marketing Campaign Brainstorm</div>
          <div className="flex space-x-2">
            <AIChip icon="G" name="GPT-4o" />
            <AIChip icon="D" name="DALL-E 3" />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <Tab name="Chat" active={activeTab === 'Chat'} onClick={() => setActiveTab('Chat')} />
          <Tab name="Collaborators (3)" active={activeTab === 'Collaborators'} onClick={() => setActiveTab('Collaborators')} />
          <Tab name="Generated Content" active={activeTab === 'Content'} onClick={() => setActiveTab('Content')} />
        </div>
        
        {/* Toolbar */}
        <div className="flex px-5 py-2 bg-white border-b border-gray-200">
          <TopicTag name="Marketing" />
          <TopicTag name="Brainstorming" />
          <TopicTag name="+ Add Tag" />
        </div>
        
        {/* Chat Container */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
          {/* User Message */}
          <Message 
            avatar="S" 
            name="Sarah" 
            isUser={true} 
            content="We need to create a marketing campaign for our new eco-friendly product line. I'm thinking we should have both visual and text content. Any ideas?" 
          />
          
          {/* AI Message */}
          <Message 
            avatar="G" 
            name="GPT-4o" 
            isUser={false} 
            model="Used by Sarah"
            content="For an eco-friendly product line, I suggest a &quot;Nature's Revival&quot; campaign theme. We could focus on before/after imagery showing environmental impact, use earthy color palettes, and emphasize sustainability metrics like &quot;X tons of plastic saved.&quot; Testimonials from environmental experts would add credibility. For messaging, emphasize both environmental benefits and product effectiveness - people want products that work well AND are sustainable."
            likes={14}
          />
          
          {/* User Message */}
          <Message 
            avatar="M" 
            name="Michael" 
            isUser={true} 
            content="I like the &quot;Nature's Revival&quot; concept. Let's visualize what this campaign could look like with some image mockups." 
          />
          
          {/* AI Message with Image */}
          <Message 
            avatar="D" 
            name="DALL-E 3" 
            isUser={false} 
            model="Used by Michael"
            content={
              <div className="bg-gray-100 p-5 rounded-lg text-center">
                <div className="text-gray-500 italic mb-2">[Image: Split-screen mockup showing polluted water on left, clean water with eco-product on right]</div>
                <div className="text-gray-500 italic">[Image: Eco-friendly packaging with earthy tones and "Nature's Revival" logo]</div>
              </div>
            }
            likes={8}
            hasVariations={true}
          />
          
          {/* User Message */}
          <Message 
            avatar="A" 
            name="Alex" 
            isUser={true} 
            content="The images look great! Now we need some compelling copy for social media posts to go with these visuals. Can we get some taglines that highlight both environmental benefits and product effectiveness?" 
          />
          
          {/* AI Message */}
          <Message 
            avatar="C" 
            name="Claude 3.7" 
            isUser={false} 
            model="Used by Alex"
            content={
              <div>
                <strong>Tagline Options:</strong><br/><br/>
                1. "Powerful for your home. Gentle on our planet."<br/>
                2. "Clean doesn't have to be dirty. Nature's Revival."<br/>
                3. "The future is clean. The future is green."<br/>
                4. "Effective by design. Sustainable by choice."<br/><br/>
                
                <strong>Social Post Draft:</strong><br/>
                "Introducing Nature's Revival – where effectiveness meets ecology. Our new product line delivers powerful results while reducing plastic waste by 94%. See the difference in your home without leaving a trace on our planet. #NaturesRevival #CleanAndGreen"
              </div>
            }
            likes={10}
            hasEdit={true}
          />
        </div>
        
        {/* Input Container */}
        <div className="p-4 bg-white border-t border-gray-200 flex">
          <textarea 
            className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm resize-none h-10"
            placeholder="Message..."
          />
          <button className="bg-blue-600 text-white font-medium rounded-md px-4 py-2">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAggregator;