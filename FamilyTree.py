import webapp2
import urllib2
import os
import jinja2
import json
import logging

from google.appengine.ext import ndb

from google.appengine.api import users

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class LoginPage(webapp2.RequestHandler):         
    def get(self):
        user = users.get_current_user()

        if user:
            self.redirect("/")
        else:
            self.redirect(users.create_login_url(self.request.uri))

class FamilyMember(ndb.Model):
    name = ndb.StringProperty()
    familyName = ndb.StringProperty()
    familyID = ndb.IntegerProperty()
    memberID = ndb.IntegerProperty()
    birthday = ndb.StringProperty()
    spouse = ndb.StringProperty()
    parents = ndb.StringProperty(repeated=True)
    children = ndb.StringProperty(repeated=True)
    links = ndb.StringProperty(repeated=True)
    stories = ndb.StringProperty(repeated=True)
    
class User(ndb.Model):
    userName = ndb.StringProperty()
    familyID = ndb.IntegerProperty()
    
    @staticmethod
    def getUser():
        myUser = None
        userName = users.get_current_user().nickname()
        myUsers = User.query().fetch()
        for user in myUsers:
            if user.userName == userName:
                myUser = user
        return myUser

class GetUserFamilyMember(webapp2.RequestHandler):         
    def get(self):
        familyID = self.request.get('familyID')
        memberID = self.request.get('memberID')
        familyMember = FamilyMember.query(FamilyMember.familyID == int(familyID), FamilyMember.memberID == int(memberID)).fetch()
        logging.info(familyMember)
        sendMember(self,familyMember[0])

def getMember(self):
    familyID = self.request.get('familyID')
    memberID = self.request.get('memberID')
    familyMemberList = FamilyMember.query(FamilyMember.familyID == int(familyID), FamilyMember.memberID == int(memberID)).fetch()
    return familyMemberList[0]

def sendMember(self,familyMember):
    jsonObj = json.dumps({"member1":familyMember.to_dict()})
    self.response.headers.add_header('content-type', 'application/json', charset='utf-8')
    self.response.out.write(jsonObj)
    
def sendtwoMembers(self,familyMember1,familyMember2):
    jsonObj = json.dumps({"member1":familyMember1.to_dict(),"member2":familyMember2.to_dict()})
    self.response.headers.add_header('content-type', 'application/json', charset='utf-8')
    self.response.out.write(jsonObj)
    
def createNewMember(self,name):
    familyID = self.request.get('familyID')
    familyMemberList = FamilyMember.query(FamilyMember.familyID == int(familyID)).fetch()
    newMember = FamilyMember(name=name,familyName=familyMemberList[0].familyName,familyID=int(familyID),memberID=len(familyMemberList)) 
    newMember.put()
    return newMember

   
class SaveBirthday(webapp2.RequestHandler):         
    def get(self):
        birthday = self.request.get('info')
        familyMember = getMember(self)
        familyMember.birthday = birthday
        familyMember.put()
        sendMember(self,familyMember)
        
class SaveSpouse(webapp2.RequestHandler):         
    def get(self):
        spouse = self.request.get('info')
        familyMember = getMember(self)
        familyMember.spouse = spouse
        familyMember.put()
        secondMember = createNewMember(self,spouse)
        sendtwoMembers(self,familyMember,secondMember)  
              
class SaveParent(webapp2.RequestHandler):         
    def get(self):
        parent = self.request.get('info')
        familyMember = getMember(self)
        familyMember.parents.append(parent)
        familyMember.put()
        secondMember = createNewMember(self,parent)
        sendtwoMembers(self,familyMember,secondMember)

class SaveChild(webapp2.RequestHandler):         
    def get(self):
        child = self.request.get('info')
        familyMember = getMember(self)
        familyMember.children.append(child)
        familyMember.put()
        secondMember = createNewMember(self,child)
        sendtwoMembers(self,familyMember,secondMember)

class SaveLink(webapp2.RequestHandler):         
    def get(self):
        link = self.request.get('info')
        familyMember = getMember(self)
        familyMember.links.append(link)
        familyMember.put()
        sendMember(self,familyMember)
                
class SaveStory(webapp2.RequestHandler):         
    def get(self):
        story = self.request.get('info')
        familyMember = getMember(self)
        familyMember.stories.append(story)
        familyMember.put()
        sendMember(self,familyMember)

class GetUserFamilyTree(webapp2.RequestHandler):         
    def get(self):
        myUser = User.getUser()
        if myUser == None:
            myUser = User(userName=users.get_current_user().nickname())
            myUser.put()
        
        if myUser.familyID == None:
            return
        familyTree = FamilyMember.query(FamilyMember.familyID == myUser.familyID).fetch()
        jsonObj = json.dumps([k.to_dict() for k in familyTree])
        self.response.headers.add_header('content-type', 'application/json', charset='utf-8')
        self.response.out.write(jsonObj)
           
class SaveFirstMember(webapp2.RequestHandler):         
    def get(self):
        familyName = self.request.get('familyName')
        memberName = self.request.get('memberName')
        
        memberMaxFamilyID = FamilyMember.query().order(-FamilyMember.familyID).fetch(1)
        familyID = 0
        if len(memberMaxFamilyID) != 0:
            familyID = memberMaxFamilyID[0].familyID + 1
        
        newMember = FamilyMember(name=memberName,familyName=familyName,familyID=familyID,memberID=0) 
        newMember.put()
        
        myUser = User.getUser()
        myUser.familyID = familyID
        myUser.put()
#         return json.dumps([k.to_dict() for k in userProfile.favFruits])
        jsonObj = json.dumps({"member":newMember.to_dict()}) 
        self.response.headers.add_header('content-type', 'application/json', charset='utf-8')
        self.response.out.write(jsonObj)
        
class GoalWebsite(webapp2.RequestHandler):         
    def get(self):
        user = users.get_current_user()
        if not user:
            self.redirect("/LoginPage")
            return
        template = JINJA_ENVIRONMENT.get_template('FamilyTree.html')
        url = users.create_logout_url("/LoginPage")
        template_values = {
            'url': url,
        }
        self.response.write(template.render(template_values))
        
        
class LogoutButton(webapp2.RequestHandler):         
    def get(self): 
#         self.response.write(users.create_logout_url("/LoginPage"))
        self.redirect(users.create_logout_url("/LoginPage"))
            
application = webapp2.WSGIApplication([
    ('/', GoalWebsite),
    ('/LoginPage', LoginPage),
    ('/SaveFirstMember', SaveFirstMember),
    ('/GetUserFamilyTree', GetUserFamilyTree),
    ('/GetUserFamilyMember', GetUserFamilyMember),
    ('/SaveBirthday', SaveBirthday),
    ('/SaveSpouse', SaveSpouse),
    ('/SaveParent', SaveParent),
    ('/SaveChild', SaveChild),
    ('/SaveLink', SaveLink),
    ('/SaveStory', SaveStory),
    ('/LogoutButton', LogoutButton),
    
], debug=True)