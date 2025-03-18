"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useVoice } from "@/contexts/VoiceContext"
import { 
  MailIcon, 
  PhoneIcon, 
  BuildingIcon, 
  MapPinIcon, 
  GlobeIcon, 
  LinkedinIcon, 
  TwitterIcon,
  ArrowLeftIcon,
  Sun,
  Moon,
  Mic,
  Volume2
} from "lucide-react"
import { Slider } from "@/components/ui/slider"

export default function Settings() {
  const router = useRouter()
  const { user, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const { 
    voiceEnabled, 
    toggleVoiceEnabled, 
    voiceSettings, 
    updateVoiceSettings, 
    speak,
    startListening,
    stopListening 
  } = useVoice()
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    department: "",
    position: "",
    organization: "",
    bio: "",
    linkedIn: "",
    twitter: "",
    website: "",
    location: "",
  })
  
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    weekly: true,
    mentions: true,
    updates: false,
  })
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    emailVisibility: false,
    phoneVisibility: false,
  })
  
  const [appearance, setAppearance] = useState({
    theme: "light",
    fontSize: "medium",
    colorScheme: "default",
  })
  
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        department: user.department || "",
        position: user.position || "",
        organization: user.organization || "",
        bio: user.bio || "",
        linkedIn: user.linkedIn || "",
        twitter: user.twitter || "",
        website: user.website || "",
        location: user.location || "",
      })
      
      if (user.profileImage) {
        setProfileImage(user.profileImage)
      }
    }
  }, [user])
  
  // Get available voices for speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);
  
  // Test voice function
  const testVoice = () => {
    speak("This is a test of the voice output. You can adjust the settings to customize how the voice sounds.");
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSaveProfile = async () => {
    try {
      const success = await updateUserProfile({ 
        ...profileData, 
        profileImage: profileImage || undefined 
      })
      
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
          variant: "default",
        })
      } else {
        toast({
          title: "Update Failed",
          description: "There was an error updating your profile. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-fit"
          onClick={() => router.push("/homepage")}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="voice">Voice Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how others see you on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
                <div className="flex-none">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileImage || ""} alt={profileData.firstName} />
                    <AvatarFallback>{profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <Label htmlFor="profile-image">Profile Photo</Label>
                  <Input 
                    id="profile-image" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended size: 300x300px. Max file size: 2MB.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={profileData.department}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={profileData.position}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="organization"
                    name="organization"
                    value={profileData.organization}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us a little about yourself"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="location"
                    name="location"
                    value={profileData.location}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                    placeholder="City, Country"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedIn">LinkedIn URL</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <LinkedinIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="linkedIn"
                    name="linkedIn"
                    value={profileData.linkedIn}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                    placeholder="https://linkedin.com/in/yourusername"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter Handle</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <TwitterIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="twitter"
                    name="twitter"
                    value={profileData.twitter}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                    placeholder="@yourusername"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="website"
                    name="website"
                    value={profileData.website}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications from the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive text message notifications
                    </p>
                  </div>
                  <Switch 
                    id="sms-notifications" 
                    checked={notifications.sms}
                    onCheckedChange={(checked) => handleNotificationChange("sms", checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-digest">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      A summary of your weekly activity and updates
                    </p>
                  </div>
                  <Switch 
                    id="weekly-digest" 
                    checked={notifications.weekly}
                    onCheckedChange={(checked) => handleNotificationChange("weekly", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mentions">Mentions</Label>
                    <p className="text-sm text-muted-foreground">
                      When someone mentions you in a comment or task
                    </p>
                  </div>
                  <Switch 
                    id="mentions" 
                    checked={notifications.mentions}
                    onCheckedChange={(checked) => handleNotificationChange("mentions", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="product-updates">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      News about product updates and new features
                    </p>
                  </div>
                  <Switch 
                    id="product-updates" 
                    checked={notifications.updates}
                    onCheckedChange={(checked) => handleNotificationChange("updates", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ 
                title: "Notification Settings Saved", 
                description: "Your notification preferences have been updated."
              })}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your information and how your data is used.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select 
                    defaultValue={privacy.profileVisibility}
                    onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view your profile</SelectItem>
                      <SelectItem value="connections">Connections Only - Only people you're connected with</SelectItem>
                      <SelectItem value="private">Private - Only you can view your profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-visibility">Email Address Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Show your email address on your profile
                    </p>
                  </div>
                  <Switch 
                    id="email-visibility" 
                    checked={privacy.emailVisibility}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, emailVisibility: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="phone-visibility">Phone Number Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Show your phone number on your profile
                    </p>
                  </div>
                  <Switch 
                    id="phone-visibility" 
                    checked={privacy.phoneVisibility}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, phoneVisibility: checked }))}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ 
                title: "Privacy Settings Saved", 
                description: "Your privacy preferences have been updated."
              })}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-5 w-5 text-muted-foreground" />
                      <span>Light</span>
                    </div>
                    <Switch 
                      checked={appearance.theme === "dark"}
                      onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, theme: checked ? "dark" : "light" }))}
                    />
                    <div className="flex items-center space-x-2">
                      <Moon className="h-5 w-5 text-muted-foreground" />
                      <span>Dark</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select 
                    defaultValue={appearance.fontSize}
                    onValueChange={(value) => setAppearance(prev => ({ ...prev, fontSize: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color-scheme">Color Scheme</Label>
                  <Select 
                    defaultValue={appearance.colorScheme}
                    onValueChange={(value) => setAppearance(prev => ({ ...prev, colorScheme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ 
                title: "Appearance Settings Saved", 
                description: "Your appearance preferences have been updated."
              })}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="voice" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>
                  Configure voice input and output settings for the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice-enabled" className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Enable Voice Features
                    </Label>
                    <Switch
                      id="voice-enabled"
                      checked={voiceEnabled}
                      onCheckedChange={toggleVoiceEnabled}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Turn on to enable voice input and output throughout the application
                  </p>
                </div>
                
                {voiceEnabled && (
                  <>
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Voice Output Settings
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="voice-select">Voice</Label>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={testVoice}
                            >
                              Test Voice
                            </Button>
                          </div>
                          <Select
                            value={voiceSettings.preferredVoiceName || ''}
                            onValueChange={(value) => 
                              updateVoiceSettings({ preferredVoiceName: value || null })
                            }
                          >
                            <SelectTrigger id="voice-select" className="w-full">
                              <SelectValue placeholder="Select a voice" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Default Voice</SelectItem>
                              {availableVoices.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name}>
                                  {voice.name} ({voice.lang})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="voice-rate">Speed</Label>
                            <span className="text-sm">{voiceSettings.voiceRate.toFixed(1)}x</span>
                          </div>
                          <Slider
                            id="voice-rate"
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[voiceSettings.voiceRate]}
                            onValueChange={(value) => 
                              updateVoiceSettings({ voiceRate: value[0] })
                            }
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="voice-pitch">Pitch</Label>
                            <span className="text-sm">{voiceSettings.voicePitch.toFixed(1)}</span>
                          </div>
                          <Slider
                            id="voice-pitch"
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[voiceSettings.voicePitch]}
                            onValueChange={(value) => 
                              updateVoiceSettings({ voicePitch: value[0] })
                            }
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="voice-volume">Volume</Label>
                            <span className="text-sm">{Math.round(voiceSettings.voiceVolume * 100)}%</span>
                          </div>
                          <Slider
                            id="voice-volume"
                            min={0}
                            max={1}
                            step={0.1}
                            value={[voiceSettings.voiceVolume]}
                            onValueChange={(value) => 
                              updateVoiceSettings({ voiceVolume: value[0] })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Voice Input Settings
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="auto-listen">Auto-Listen on Page Load</Label>
                            <Switch
                              id="auto-listen"
                              checked={voiceSettings.autoListen}
                              onCheckedChange={(checked) => 
                                updateVoiceSettings({ autoListen: checked })
                              }
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Automatically start listening when pages load
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="auto-start">Automatic Response</Label>
                            <Switch
                              id="auto-start"
                              checked={voiceSettings.autoStart}
                              onCheckedChange={(checked) => 
                                updateVoiceSettings({ autoStart: checked })
                              }
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Automatically read responses aloud after voice input
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-medium">Privacy Notice</h4>
                      <p className="text-sm text-muted-foreground">
                        Voice data is processed locally in your browser and is not stored or sent to any server unless 
                        explicitly submitted for AI processing. You can disable voice features at any time.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="default" onClick={() => toast({ title: "Voice settings saved" })}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
